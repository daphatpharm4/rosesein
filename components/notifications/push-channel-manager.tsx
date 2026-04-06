"use client";

import { useState } from "react";

type PushChannelManagerProps = {
  vapidPublicKey: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushChannelManager({ vapidPublicKey }: PushChannelManagerProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enablePush = async () => {
    if (!vapidPublicKey) {
      setStatus("Configuration push manquante côté application.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("Les notifications push ne sont pas disponibles sur cet appareil.");
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("L'autorisation navigateur a été refusée.");
        setBusy(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/notifications/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setStatus("Cet appareil est prêt pour les notifications push.");
    } catch {
      setStatus("L'activation push a échoué.");
    } finally {
      setBusy(false);
    }
  };

  const disablePush = async () => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/notifications/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setStatus("Les notifications push sont désactivées sur cet appareil.");
    } catch {
      setStatus("La désactivation push a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-brand bg-surface-container-low px-4 py-4">
      <p className="font-headline text-base font-semibold text-on-surface">
        Appareil pour notifications push
      </p>
      <p className="text-sm leading-7 text-on-surface-variant">
        Activez ce canal sur le navigateur actuel après avoir coché l&apos;option push
        juste au-dessus.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={enablePush}
          disabled={busy}
          className="rounded-full bg-gradient-primary px-4 py-2.5 font-label text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          Activer sur cet appareil
        </button>
        <button
          type="button"
          onClick={disablePush}
          disabled={busy}
          className="rounded-full bg-surface-container-lowest px-4 py-2.5 font-label text-sm font-semibold text-on-surface shadow-ambient disabled:opacity-60"
        >
          Retirer cet appareil
        </button>
      </div>
      {status ? <p className="text-sm leading-7 text-on-surface-variant">{status}</p> : null}
    </div>
  );
}
