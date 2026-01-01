export const API_BASE = "http://localhost:3000";

export type Site = {
  id: string;
  name: string;
  description?: string | null;
  lat: number;
  lng: number;
  difficulty?: string | null;
};

export type EventType = "LAKE_DIVE" | "TRAVEL";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "DONE";

export type EventItem = {
  id: string;
  type: EventType;
  status: EventStatus;
  title: string;
  description?: string | null;
  meetingPoint?: string | null;
  startAt: string; // ISO
  endAt?: string | null; // ISO
  capacity: number;
  priceArs: number;
  minLevel?: string | null;
  maxDepth?: number | null;
  siteId?: string | null;
  site?: Site | null;
  _count?: { reservations: number };
};

export type Reservation = {
  id: string;
  eventId: string;
  userName: string;
  phone?: string | null;
  status: "RESERVED" | "CANCELLED" | "CHECKED_IN";
  createdAt: string;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kd_token");
}

export function setToken(token: string) {
  localStorage.setItem("kd_token", token);
}

export function clearToken() {
  localStorage.removeItem("kd_token");
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}