/**
 * lib/push.ts — browser Web Push subscription helpers.
 *
 * Registers the service worker, requests notification permission, and
 * subscribes the browser to push. The resulting subscription is persisted to
 * the backend under the signed-in client's email.
 */

import { API_URL } from "./api";

const SW_PATH = "/sw.js";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export type PushPermissionState = "granted" | "denied" | "prompt" | "unsupported";

/** Whether the browser supports push at all. */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Current notification permission state. */
export function notificationPermission(): PushPermissionState {
  if (!pushSupported()) return "unsupported";
  return Notification.permission as PushPermissionState;
}

/** Request notification permission. Resolves to the resulting state. */
export async function requestNotificationPermission(): Promise<PushPermissionState> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result as PushPermissionState;
}

/** Register the service worker (idempotent). */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return await navigator.serviceWorker.register(SW_PATH);
}

/** Fetch the VAPID public key from the backend. */
async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/api/push/vapid-public-key`);
  if (!res.ok) throw new Error("Failed to load push configuration.");
  const data = (await res.json()) as { publicKey: string };
  return data.publicKey;
}

/**
 * Subscribe the browser to push and persist the subscription to the backend.
 * Requires an active client session (the HttpOnly ilp_client_session cookie,
 * sent with credentials: "include"). Returns true on success.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const registration = await registerServiceWorker();
    const publicKey = await fetchVapidPublicKey();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const res = await fetch(`${API_URL}/api/push/subscribe`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Subscribe the browser to push locally, without persisting to the backend.
 * Used during signup, before the customer has an authenticated session. The
 * subscription is persisted later by `subscribeToPush()` once the customer
 * authenticates via OTP, so a subscription is never stored under an
 * unverified email.
 */
export async function subscribeLocally(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const registration = await registerServiceWorker();
    const publicKey = await fetchVapidPublicKey();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    return !!subscription;
  } catch {
    return false;
  }
}

/** Remove the browser subscription and clear it from the backend. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!pushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;
    if (subscription) await subscription.unsubscribe();

    // Best effort: without a session the server answers 401 and the
    // browser-side subscription is already gone.
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}