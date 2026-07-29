import { useCallback, useEffect, useMemo, useState } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Unread-leads counter for the top-bar Notifications chip. We deliberately
// store the "last read" cursor client-side in localStorage (keyed per
// workspace) so the backend stays untouched. Any contact whose createdAt
// is more recent than the stored cursor counts as unread. Reading a single
// lead bumps the cursor to that lead's createdAt so it drops from the list
// without hiding leads that arrived later.

// Bump the version suffix to force every workspace's notif cursor to
// reset on the next page load (Clément asked for a one-shot reset on
// Galaxy Glass · since localStorage is per-origin and we key by
// workspace id, this only affects users who had a cursor from the
// previous build; a fresh install stays empty).
const storageKey = (workspaceId: string | null | undefined): string =>
  `buzzle-notif-lastread-v2:${workspaceId ?? 'default'}`;

const readCursor = (workspaceId: string | null | undefined): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(storageKey(workspaceId));
  if (raw === null) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const writeCursor = (
  workspaceId: string | null | undefined,
  ts: number,
): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(workspaceId), String(ts));
};

export type UnreadLead = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  createdAtMs: number;
};

const contactDisplayName = (contact: Record<string, unknown>): string => {
  const nameField = contact.name;
  // Buzzle client forms (Galaxy Glass, BF, etc.) push the full name as
  // a plain string into `contact.name` · Twenty's default schema stores
  // it as `{ firstName, lastName }`. Support both shapes.
  if (typeof nameField === 'string' && nameField.trim().length > 0) {
    return nameField.trim();
  }
  if (nameField !== null && typeof nameField === 'object') {
    const obj = nameField as {
      firstName?: string | null;
      lastName?: string | null;
    };
    const first = (obj.firstName ?? '').trim();
    const last = (obj.lastName ?? '').trim();
    const full = `${first} ${last}`.trim();
    if (full.length > 0) return full;
  }
  return 'Lead sans nom';
};

const contactPhone = (contact: Record<string, unknown>): string => {
  const phone = (contact as { phone?: { primaryPhoneNumber?: string | null } })
    .phone;
  return phone?.primaryPhoneNumber ?? '';
};

export type UseBuzzleUnreadLeadsResult = {
  unread: UnreadLead[];
  count: number;
  markOneRead: (createdAt: string) => void;
  markAllRead: () => void;
};

export const useBuzzleUnreadLeads = (): UseBuzzleUnreadLeadsResult => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const workspaceId = currentWorkspace?.id ?? null;

  const { findActiveObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const contactObject = findActiveObjectMetadataItemByNamePlural('contacts');

  const { records } = useFindManyRecords({
    objectNameSingular: 'contact',
    skip: !contactObject,
    limit: 50,
  });

  const [cursor, setCursor] = useState<number>(() => readCursor(workspaceId));

  // Re-hydrate the cursor when the workspace changes (or another tab
  // writes to localStorage).
  useEffect(() => {
    setCursor(readCursor(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: StorageEvent) => {
      if (event.key === storageKey(workspaceId)) {
        setCursor(readCursor(workspaceId));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [workspaceId]);

  const allLeads = useMemo<UnreadLead[]>(() => {
    const list = (records ?? []) as Array<Record<string, unknown>>;
    return list
      .map((c) => {
        const createdAtRaw = c.createdAt;
        const createdAt = typeof createdAtRaw === 'string' ? createdAtRaw : '';
        const createdAtMs = createdAt ? Date.parse(createdAt) : 0;
        return {
          id: String(c.id ?? ''),
          name: contactDisplayName(c),
          phone: contactPhone(c),
          createdAt,
          createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
        };
      })
      .filter((l) => l.id && l.createdAtMs > 0)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [records]);

  const unread = useMemo<UnreadLead[]>(
    () => allLeads.filter((l) => l.createdAtMs > cursor).slice(0, 20),
    [allLeads, cursor],
  );

  const markAllRead = useCallback(() => {
    const now = Date.now();
    writeCursor(workspaceId, now);
    setCursor(now);
  }, [workspaceId]);

  const markOneRead = useCallback(
    (createdAt: string) => {
      const ts = Date.parse(createdAt);
      if (!Number.isFinite(ts)) return;
      const next = Math.max(cursor, ts);
      writeCursor(workspaceId, next);
      setCursor(next);
    },
    [cursor, workspaceId],
  );

  return {
    unread,
    count: unread.length,
    markOneRead,
    markAllRead,
  };
};
