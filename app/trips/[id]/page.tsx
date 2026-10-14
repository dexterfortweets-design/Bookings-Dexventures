"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, kes } from "@/lib/supabase";
export default function Book() {
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<any>(null); const [seats, setSeats] = useState(1); const [err, setErr] = useState("");
  useEffect(() => { supabase.from("trip_availability").select("*").eq("id", id).single().then(({ data }) => setT(data)); }, [id]);
  async function book() {
    const { error } = await supabase.rpc("book_trip", { p_trip: id, p_seats: seats });
    if (error) return setErr(error.message === "Sign in to book" ? "Log in first from the Account page." : error.message);
    location.href = "/bookings";
  }
  if (!t) return <p>Loading…</p>;
  const total = t.price * seats;
  return (<div className="card">
    <h2>{t.title}</h2><p className="mute">{new Date(t.trip_date).toDateString()} · Departs {t.departure}</p>
    <label>Seats (max {t.seats_left})<input type="number" min={1} max={t.seats_left} value={seats} onChange={e => setSeats(Math.max(1, +e.target.value))} /></label>
    <p>Total <b>{kes(total)}</b> · Pay now (40%) <b>{kes(Math.ceil(total * 0.4))}</b> · Balance later <b>{kes(total - Math.ceil(total * 0.4))}</b></p>
    <p className="err">{err}</p><button onClick={book}>Reserve and continue to payment</button>
    <p className="mute">Seats are held for 15 minutes while you pay the deposit.</p>
  </div>);
}
