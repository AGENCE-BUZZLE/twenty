import { useCallback, useEffect, useState } from 'react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Web Push (nouveaux leads) pour la PWA Buzzle CRM. La clé VAPID publique
// n'est pas secrète · elle sert au navigateur à créer l'abonnement. Le
// micro-service push (localhost sur le VPS) détient la clé privée. Le
// front s'abonne puis POST l'abonnement au webhook n8n (passerelle),
// qui relaie au micro-service.

const VAPID_PUBLIC_KEY =
  'BL7fh_VQfS9km84VL-fafnTkuaP7ALO0fdKZEUAtP1QA4G-FhAC9oQHsQ_gG0tDxJl5EjH0F6FuRJCst1oi8PoM';

const SUBSCRIBE_URL = 'https://n8n.agence-buzzle.com/webhook/push-subscribe';

const SW_URL = '/sw.js';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (
    window.navigator as unknown as { standalone?: boolean }
  ).standalone;
  return (
    iosStandalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  );
};

const isIOS = (): boolean =>
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export type BuzzlePushState = {
  // 'unsupported' : navigateur sans Push API (ou iOS pas encore installé)
  // 'need-install' : iOS Safari · doit d'abord ajouter à l'écran d'accueil
  // 'default' | 'granted' | 'denied' : état de la permission
  status:
    | 'unsupported'
    | 'need-install'
    | 'default'
    | 'granted'
    | 'denied';
  busy: boolean;
  enable: () => Promise<void>;
};

export const useBuzzlePush = (): BuzzlePushState => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const currentUser = useAtomStateValue(currentUserState);
  const [status, setStatus] = useState<BuzzlePushState['status']>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasApis =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    if (!hasApis) {
      // Sur iOS, les API push n'existent que dans la PWA installée.
      setStatus(isIOS() && !isStandalone() ? 'need-install' : 'unsupported');
      return;
    }
    setStatus(Notification.permission as BuzzlePushState['status']);
  }, []);

  // Enregistre le SW au montage si la permission est déjà accordée, pour
  // que les push arrivent même sans repasser par le bouton.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (Notification?.permission !== 'granted') return;
    navigator.serviceWorker.register(SW_URL).catch(() => {});
  }, []);

  const enable = useCallback(async () => {
    if (busy) return;
    if (typeof window === 'undefined') return;
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setStatus(isIOS() && !isStandalone() ? 'need-install' : 'unsupported');
      return;
    }

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as BuzzlePushState['status']);
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY,
          ) as BufferSource,
        }));

      // text/plain = requête "simple" · pas de preflight CORS.
      await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          workspaceId: currentWorkspace?.id ?? null,
          label:
            (currentUser?.firstName ?? '') +
            ' · ' +
            (navigator.platform || 'device'),
        }),
      }).catch(() => {});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[BuzzlePush] enable failed', error);
    } finally {
      setBusy(false);
    }
  }, [busy, currentWorkspace?.id, currentUser?.firstName]);

  return { status, busy, enable };
};
