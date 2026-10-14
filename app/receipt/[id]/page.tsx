"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, kes } from "@/lib/supabase";
export default function Receipt() {
  const { id } = useParams<{ id: string }>(); const [r, setR] = useState<any>(null);
  useEffect(() => { supabase.from("receipts").select("*, payments(mpesa_ref,kind,phone), bookings(seats,total,paid,profiles(full_name,phone),trips(title,trip_date,departure))").eq("id", id).single().then(({ data }) => setR(data)); }, [id]);
  if (!r) return <p>Loading…</p>;
  const Copy = ({ label }: { label: string }) => (<div className="copy">
    <h3 style={{ margin: 0 }}>Dex Ventures Tours and Travel — {label}</h3>
    <p><b>{r.number}</b> · {new Date(r.created_at).toLocaleString("en-KE")}</p>
    <p>Received from {r.bookings.profiles.full_name} ({r.payments.phone})</p>
    <p>{r.bookings.trips.title}, {new Date(r.bookings.trips.trip_date).toDateString()} · {r.bookings.seats} seat(s)</p>
    <p>Payment ({r.payments.kind}): <b>{kes(r.amount)}</b> · M-Pesa ref {r.payments.mpesa_ref}</p>
    <p>Trip total {kes(r.bookings.total)} · Balance due {kes(r.balance)}</p></div>);
  return (<><Copy label="Customer copy" /><Copy label="Merchant copy" /><button className="noprint" onClick={() => window.print()}>Print or save as PDF</button></>);
}
