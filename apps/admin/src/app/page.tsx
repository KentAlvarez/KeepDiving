"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  API_BASE,
  EventItem,
  EventStatus,
  EventType,
  Reservation,
  Site,
  apiGet,
  apiPost,
  setToken,
  clearToken,
  getToken,
} from "@/lib/api";

// Leaflet map (client only)
const SitesMap = dynamic(() => import("@/components/SitesMap"), { ssr: false });

function toMonthStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function fmtLocal(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Page() {
  /* ================= AUTH ================= */
  const [authEmail, setAuthEmail] = useState("admin@keepdiving.com");
  const [authPass, setAuthPass] = useState("123456");
  const [isAuthed, setIsAuthed] = useState(false);

  /* ================= UI ================= */
  const [tab, setTab] = useState<"events" | "sites">("events");
  const [month, setMonth] = useState(() => toMonthStr(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= DATA ================= */
  const [sites, setSites] = useState<Site[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  const [participants, setParticipants] = useState<Reservation[] | null>(null);
  const [participantsEventId, setParticipantsEventId] = useState<string | null>(null);

  /* ================= EVENT FORM ================= */
  const [eventForm, setEventForm] = useState({
    type: "LAKE_DIVE" as EventType,
    status: "PUBLISHED" as EventStatus,
    title: "",
    meetingPoint: "",
    startAtLocal: "",
    capacity: 12,
    priceArs: 45000,
    siteId: "",
  });

  const canCreateEvent = useMemo(
    () =>
      eventForm.title.trim() &&
      eventForm.startAtLocal &&
      eventForm.capacity > 0,
    [eventForm]
  );

  /* ================= SITE FORM ================= */
  const [siteForm, setSiteForm] = useState({
    name: "",
    description: "",
    lat: -31.4167,
    lng: -64.1833,
    difficulty: "",
  });

  const canCreateSite = useMemo(
    () => siteForm.name.trim().length > 0,
    [siteForm]
  );

  /* ================= LOAD ================= */
  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, e] = await Promise.all([
        apiGet<Site[]>("/sites"),
        apiGet<EventItem[]>(`/events?month=${month}`),
      ]);
      setSites(s);
      setEvents(e);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setIsAuthed(!!getToken());
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  /* ================= AUTH ================= */
  async function doLogin() {
    try {
      const res = await apiPost<{ access_token: string }>("/auth/login", {
        email: authEmail,
        password: authPass,
      });
      setToken(res.access_token);
      setIsAuthed(true);
      await loadAll();
    } catch (err: any) {
      alert(err?.message ?? String(err));
    }
  }

  function doLogout() {
    clearToken();
    setIsAuthed(false);
  }

  /* ================= EVENTS ================= */
  async function createEvent() {
    if (!canCreateEvent || !isAuthed) return;

    const start = new Date(eventForm.startAtLocal);
    if (isNaN(start.getTime())) {
      alert("Fecha inválida");
      return;
    }

    await apiPost("/admin/events", {
      type: eventForm.type,
      status: eventForm.status,
      title: eventForm.title,
      meetingPoint: eventForm.meetingPoint || undefined,
      startAt: start.toISOString(),
      capacity: Number(eventForm.capacity),
      priceArs: Number(eventForm.priceArs),
      siteId: eventForm.siteId || undefined,
    });

    setEventForm((f) => ({ ...f, title: "", meetingPoint: "" }));
    await loadAll();
  }

  async function showParticipants(eventId: string) {
    if (!isAuthed) return;
    setParticipantsEventId(eventId);
    setParticipants(null);
    const data = await apiGet<Reservation[]>(
      `/admin/events/${eventId}/participants`
    );
    setParticipants(data);
  }

  async function quickReserve(eventId: string) {
    const name = prompt("Nombre:", "Kent");
    if (!name) return;
    await apiPost(`/events/${eventId}/reserve`, { userName: name });
    await loadAll();
  }

  /* ================= SITES ================= */
  async function createSite() {
    if (!canCreateSite || !isAuthed) return;

    await apiPost("/sites", {
      name: siteForm.name,
      description: siteForm.description || undefined,
      lat: siteForm.lat,
      lng: siteForm.lng,
      difficulty: siteForm.difficulty || undefined,
    });

    setSiteForm((f) => ({ ...f, name: "", description: "" }));
    await loadAll();
  }

  /* ================= UI ================= */
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-col gap-3 md:flex-row md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">KeepDiving Admin</h1>
            <p className="text-xs text-gray-500">API: {API_BASE}</p>
          </div>

          <div className="flex gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            />

            {!isAuthed ? (
              <>
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  type="password"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                />
                <button
                  onClick={doLogin}
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                >
                  Login
                </button>
              </>
            ) : (
              <button
                onClick={doLogout}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Logout
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("events")}
            className={`rounded-xl px-4 py-2 text-sm ${
              tab === "events" ? "bg-black text-white" : "border"
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setTab("sites")}
            className={`rounded-xl px-4 py-2 text-sm ${
              tab === "sites" ? "bg-black text-white" : "border"
            }`}
          >
            Mapa / Sitios
          </button>
        </div>

        {/* ================= EVENTS TAB ================= */}
        {tab === "events" && (
          <>
            <section className="rounded-2xl border bg-white p-4">
              <h2 className="font-semibold mb-2">Crear evento</h2>

              <div className="grid gap-2 md:grid-cols-2">
                <input
                  placeholder="Título"
                  className="rounded-xl border px-3 py-2"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, title: e.target.value }))
                  }
                />

                <input
                  type="datetime-local"
                  className="rounded-xl border px-3 py-2"
                  value={eventForm.startAtLocal}
                  onChange={(e) =>
                    setEventForm((f) => ({
                      ...f,
                      startAtLocal: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  placeholder="Cupos"
                  className="rounded-xl border px-3 py-2"
                  value={eventForm.capacity}
                  onChange={(e) =>
                    setEventForm((f) => ({
                      ...f,
                      capacity: Number(e.target.value),
                    }))
                  }
                />

                <input
                  type="number"
                  placeholder="Precio ARS"
                  className="rounded-xl border px-3 py-2"
                  value={eventForm.priceArs}
                  onChange={(e) =>
                    setEventForm((f) => ({
                      ...f,
                      priceArs: Number(e.target.value),
                    }))
                  }
                />

                <select
                  className="rounded-xl border px-3 py-2 md:col-span-2"
                  value={eventForm.siteId}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, siteId: e.target.value }))
                  }
                >
                  <option value="">— Sin sitio —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={createEvent}
                disabled={!canCreateEvent || !isAuthed}
                className="mt-3 w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-40"
              >
                Crear evento
              </button>
            </section>

            <section className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="rounded-xl border p-3">
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-sm text-gray-600">
                    {fmtLocal(ev.startAt)} — $
                    {ev.priceArs.toLocaleString("es-AR")}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => showParticipants(ev.id)}
                      className="rounded-xl border px-3 py-1 text-sm"
                    >
                      Participantes
                    </button>
                    <button
                      onClick={() => quickReserve(ev.id)}
                      className="rounded-xl bg-black px-3 py-1 text-sm text-white"
                    >
                      Reservar (test)
                    </button>
                  </div>

                  {participantsEventId === ev.id && participants && (
                    <div className="mt-2 text-sm">
                      {participants.map((p) => (
                        <div key={p.id}>
                          {p.userName} — {p.status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          </>
        )}

        {/* ================= SITES TAB ================= */}
        {tab === "sites" && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4">
              <h2 className="font-semibold mb-2">
                Mapa (click para elegir punto)
              </h2>

              <SitesMap
                sites={sites}
                selected={{ lat: siteForm.lat, lng: siteForm.lng }}
                onPick={(lat, lng) =>
                  setSiteForm((f) => ({ ...f, lat, lng }))
                }
              />

              <p className="text-xs text-gray-600 mt-2">
                Lat/Lng se actualiza al hacer click.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <h2 className="font-semibold mb-2">Crear sitio</h2>

              <input
                placeholder="Nombre"
                className="rounded-xl border px-3 py-2 w-full mb-2"
                value={siteForm.name}
                onChange={(e) =>
                  setSiteForm((f) => ({ ...f, name: e.target.value }))
                }
              />

              <textarea
                placeholder="Descripción"
                className="rounded-xl border px-3 py-2 w-full mb-2"
                value={siteForm.description}
                onChange={(e) =>
                  setSiteForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />

              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  className="rounded-xl border px-3 py-2"
                  value={siteForm.lat}
                  onChange={(e) =>
                    setSiteForm((f) => ({
                      ...f,
                      lat: Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="number"
                  className="rounded-xl border px-3 py-2"
                  value={siteForm.lng}
                  onChange={(e) =>
                    setSiteForm((f) => ({
                      ...f,
                      lng: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <button
                onClick={createSite}
                disabled={!canCreateSite || !isAuthed}
                className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-40"
              >
                Crear sitio
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
