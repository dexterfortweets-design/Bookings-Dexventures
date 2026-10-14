"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, kes } from "@/lib/supabase";
export default function Trips() {
  const [trips, setTrips] = useState<any[] | null>(null);
  useEffect(() => { supabase.from("trip_availability").select("*").eq("status", "open").order("trip_date").then(({ data }) => setTrips(data || [])); }, []);
  if (!trips) return <p>Loading trips…</p>;
  if (!trips.length) return <p>No trips are open right now. Check back soon.</p>;
  return <>{trips.map(t => (
    <div className="card" key={t.id}>
      <h2 style={{ margin: 0 }}>{t.title}</h2>
      <p className="mute">{new Date(t.trip_date).toDateString()} · Departs {t.departure} · {t.seats_left} seats left</p>
      <p>{t.description}</p>
      <span className="price">{kes(t.price)} per student</span>{" "}
      {t.seats_left > 0 ? <Link className="btn" href={`/trips/${t.id}`}>Book now</Link> : <b>Fully booked</b>}
    </div>))}</>;
}
