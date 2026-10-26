/**
 * lib/push.ts — browser Web Push subscription helpers.
 *
 * Registers the service worker, requests notification permission, and
 * subscribes the browser to push. The resulting subscription is persisted to
 * the backend under the signed-in client's email.
 */

import { API_URL } from "./api";
import { getClientToken } from "./status";

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
 * Requires an active client session (x-client-token). Returns true on success.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const token = getClientToken();
  if (!token) return false;

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
      headers: {
        "Content-Type": "application/json",
        "x-client-token": token,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Subscribe the browser to push during signup (no client session yet) and
 * persist the subscription under the provided email via the public endpoint.
 */
export async function subscribeToPushPublic(email: string): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (!email) return false;

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

    const res = await fetch(`${API_URL}/api/push/subscribe-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subscription: subscription.toJSON() }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/** Remove the browser subscription and clear it from the backend. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!pushSupported()) return false;

  const token = getClientToken();

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;
    if (subscription) await subscription.unsubscribe();

    if (token) {
      await fetch(`${API_URL}/api/push/subscribe`, {
        method: "DELETE",
        headers: { "x-client-token": token },
      });
    }
    return true;
  } catch {
    return false;
  }
}