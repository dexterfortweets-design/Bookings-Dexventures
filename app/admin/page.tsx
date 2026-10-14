"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, kes } from "@/lib/supabase";
export default function Admin() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { supabase.from("receipts").select("*, bookings(seats,total,paid,profiles(full_name,phone),trips(title))").order("created_at", { ascending: false }).then(({ data }) => setRows(data || [])); }, []);
  if (!rows) return <p>Loading…</p>;
  const wa = (r: any) => `https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP}?text=` + encodeURIComponent(
    `Merchant copy ${r.number}\n${r.bookings.profiles.full_name} (${r.bookings.profiles.phone})\n${r.bookings.trips.title} · ${r.bookings.seats} seat(s)\nPaid ${kes(r.amount)} · Balance ${kes(r.balance)}\n${location.origin}/receipt/${r.id}`);
  return (<><h2>Receipts</h2><p className="mute">Admins only. Trips are managed in the Supabase table editor for now.</p>
    {!rows.length && <p>No receipts yet, or this account is not an admin.</p>}
    {rows.map(r => (<div className="card" key={r.id}>
      <b>{r.number}</b> · {kes(r.amount)} · {r.bookings.profiles.full_name} · {r.bookings.trips.title}<br />
      <Link href={`/receipt/${r.id}`}>Open</Link> · <a href={wa(r)} target="_blank" rel="noopener">Send merchant copy to WhatsApp</a>
    </div>))}</>);
}
