import { useCallback, useEffect, useMemo, useState } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Unread-leads counter for the top-bar Notifications chip. Read state is
// stored client-side in localStorage as a SET of read lead ids (keyed per
// workspace) so the backend stays untouched. A lead is unread until its id
// is in the set. Reading one lead adds ONLY its id · it never touches the
// read state of other (even older) leads the user hasn't opened.

const storageKey = (workspaceId: string | null | undefined): string =>
  `buzzle-notif-read-ids-v3:${workspaceId ?? 'default'}`;

// Legacy cursor key (v2) · used once to migrate existing users so their
// already-read leads don't all pop back as unread on the switch.
const legacyCursorKey = (workspaceId: string | null | undefined): string =>
  `buzzle-notif-lastread-v2:${workspaceId ?? 'default'}`;

const readIdSet = (workspaceId: string | null | undefined): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const raw = window.localStorage.getItem(storageKey(workspaceId));
  if (raw === null) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
};

const writeIdSet = (
  workspaceId: string | null | undefined,
  ids: Set<string>,
): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    storageKey(workspaceId),
    JSON.stringify(Array.from(ids)),
  );
};

const legacyCursor = (workspaceId: string | null | undefined): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(legacyCursorKey(workspaceId));
  if (raw === null) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
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
  markOneRead: (leadId: string) => void;
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

  const [readIds, setReadIds] = useState<Set<string>>(() =>
    readIdSet(workspaceId),
  );

  // Re-hydrate the set when the workspace changes (or another tab writes
  // to localStorage).
  useEffect(() => {
    setReadIds(readIdSet(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: StorageEvent) => {
      if (event.key === storageKey(workspaceId)) {
        setReadIds(readIdSet(workspaceId));
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

  // One-shot migration : if the v3 set doesn't exist yet but a legacy v2
  // cursor does, seed the read set with every lead that was already read
  // under the cursor (createdAt <= cursor) so nothing pops back as unread.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (allLeads.length === 0) return;
    const alreadyMigrated =
      window.localStorage.getItem(storageKey(workspaceId)) !== null;
    if (alreadyMigrated) return;
    const cursor = legacyCursor(workspaceId);
    if (cursor <= 0) return;
    const seeded = new Set(
      allLeads.filter((l) => l.createdAtMs <= cursor).map((l) => l.id),
    );
    writeIdSet(workspaceId, seeded);
    setReadIds(seeded);
  }, [allLeads, workspaceId]);

  const unread = useMemo<UnreadLead[]>(
    () => allLeads.filter((l) => !readIds.has(l.id)).slice(0, 20),
    [allLeads, readIds],
  );

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      allLeads.forEach((l) => next.add(l.id));
      writeIdSet(workspaceId, next);
      return next;
    });
  }, [allLeads, workspaceId]);

  // Marks ONLY this lead read · other unopened leads (even older ones)
  // stay in the notifications list.
  const markOneRead = useCallback(
    (leadId: string) => {
      if (!leadId) return;
      setReadIds((prev) => {
        if (prev.has(leadId)) return prev;
        const next = new Set(prev);
        next.add(leadId);
        writeIdSet(workspaceId, next);
        return next;
      });
    },
    [workspaceId],
  );

  return {
    unread,
    count: unread.length,
    markOneRead,
    markAllRead,
  };
};
