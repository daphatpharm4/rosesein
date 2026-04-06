import "server-only";

import { headers } from "next/headers";

import { getSiteUrl } from "@/lib/env";

function normalizeSiteUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.origin;
  } catch {
    return null;
  }
}

function normalizeHost(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const host = value.split(",")[0]?.trim();

  if (!host) {
    return null;
  }

  return host.replace(/\/$/, "");
}

function getProtocol(host: string, forwardedProto: string | null) {
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
}

export async function getRequestSiteUrl() {
  const requestHeaders = await headers();
  const origin = normalizeSiteUrl(requestHeaders.get("origin"));

  if (origin) {
    return origin;
  }

  const host = normalizeHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  if (host) {
    return `${getProtocol(host, requestHeaders.get("x-forwarded-proto"))}://${host}`;
  }

  const vercelUrl = normalizeSiteUrl(process.env.VERCEL_URL);

  if (vercelUrl) {
    return vercelUrl;
  }

  return getSiteUrl();
}
