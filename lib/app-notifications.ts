import "server-only";

import webpush, { type PushSubscription } from "web-push";

import {
  getPushVapidPrivateKey,
  getPushVapidPublicKey,
  getResendApiKey,
  getResendFromEmail,
  getSiteUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type NotificationKind = "message" | "article" | "event" | "community_reply";

type NotificationPreferenceRow = {
  messages_enabled: boolean;
  replies_enabled: boolean;
  news_enabled: boolean;
  events_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotifyUserInput = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href?: string | null;
};

function getKindPreferenceKey(kind: NotificationKind) {
  if (kind === "message") return "messages_enabled";
  if (kind === "community_reply") return "replies_enabled";
  if (kind === "article") return "news_enabled";
  return "events_enabled";
}

let pushConfigured = false;

function configureWebPush() {
  if (pushConfigured) {
    return true;
  }

  const publicKey = getPushVapidPublicKey();
  const privateKey = getPushVapidPrivateKey();

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(`mailto:support@rosesein.local`, publicKey, privateKey);
  pushConfigured = true;
  return true;
}

async function sendEmailNotification(
  email: string,
  title: string,
  body: string | null | undefined,
  href: string | null | undefined
) {
  const resendApiKey = getResendApiKey();
  const resendFromEmail = getResendFromEmail();

  if (!resendApiKey || !resendFromEmail) {
    return;
  }

  const targetUrl = href ? new URL(href, getSiteUrl()).toString() : null;
  const text = [title, body ?? "", targetUrl ? `Ouvrir: ${targetUrl}` : ""]
    .filter(Boolean)
    .join("\n\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject: title,
      text,
    }),
  });
}

async function sendPushNotification(
  subscriptions: PushSubscriptionRow[],
  title: string,
  body: string | null | undefined,
  href: string | null | undefined
) {
  if (!configureWebPush() || subscriptions.length === 0) {
    return;
  }

  const payload = JSON.stringify({
    title,
    body: body ?? "",
    href: href ? new URL(href, getSiteUrl()).toString() : getSiteUrl(),
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch {
        // Expired or invalid subscriptions are cleaned up lazily by the settings surface.
      }
    })
  );
}

export async function notifyUser({
  userId,
  kind,
  title,
  body,
  href,
}: NotifyUserInput) {
  let admin;

  try {
    getSupabaseServiceRoleKey();
    admin = createSupabaseAdminClient();
  } catch {
    return null;
  }

  const { data: inserted } = await admin
    .from("notifications")
    .insert({
      user_id: userId,
      kind,
      title,
      body: body ?? null,
      href: href ?? null,
    })
    .select("id")
    .maybeSingle();

  const [{ data: preferences }, { data: subscriptions }] = await Promise.all([
    admin
      .from("notification_preferences")
      .select(
        "messages_enabled, replies_enabled, news_enabled, events_enabled, email_enabled, push_enabled"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId),
  ]);

  const pref = preferences as NotificationPreferenceRow | null;
  if (pref && !pref[getKindPreferenceKey(kind)]) {
    return inserted?.id ?? null;
  }

  if (pref?.email_enabled) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser.user?.email ?? null;

    if (email) {
      await sendEmailNotification(email, title, body, href);
    }
  }

  if (pref?.push_enabled) {
    await sendPushNotification(
      (subscriptions ?? []) as PushSubscriptionRow[],
      title,
      body,
      href
    );
  }

  return inserted?.id ?? null;
}

export async function notifyManyUsers(inputs: NotifyUserInput[]) {
  await Promise.all(inputs.map((input) => notifyUser(input)));
}
