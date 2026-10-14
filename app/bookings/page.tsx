"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, kes } from "@/lib/supabase";
export default function Bookings() {
  const [rows, setRows] = useState<any[] | null>(null); const [phone, setPhone] = useState(""); const [msg, setMsg] = useState("");
  const load = () => supabase.from("bookings").select("*, trips(title,trip_date), receipts(id,number,amount)").order("created_at", { ascending: false }).then(({ data }) => setRows(data || []));
  useEffect(() => { load(); supabase.auth.getUser().then(({ data }) => setPhone(data.user?.user_metadata?.phone || "")); }, []);
  async function pay(bookingId: string, kind: string) {
    setMsg("");
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ bookingId, kind, phone }) });
    const j = await r.json();
    setMsg(j.error || "Check your phone and enter your M-Pesa PIN. Refresh this page after paying to see your receipt.");
  }
  if (!rows) return <p>Loading…</p>;
  if (!rows.length) return <p>You have no bookings yet. Pick a trip from the Trips page.</p>;
  return (<>
    <div className="card"><label>M-Pesa number for payments<input value={phone} onChange={e => setPhone(e.target.value)} /></label><p>{msg}</p><button onClick={load}>Refresh</button></div>
    {rows.map(b => (<div className="card" key={b.id}>
      <h3 style={{ margin: 0 }}>{b.trips.title}</h3>
      <p className="mute">{new Date(b.trips.trip_date).toDateString()} · {b.seats} seat(s) · {b.status.replace("_", " ")}</p>
      <p>Total {kes(b.total)} · Paid {kes(b.paid)} · Balance {kes(b.total - b.paid)}</p>
      {b.status === "pending" && <button onClick={() => pay(b.id, "deposit")}>Pay deposit {kes(b.deposit)}</button>}
      {b.status === "deposit_paid" && <button onClick={() => pay(b.id, "balance")}>Pay balance {kes(b.total - b.paid)}</button>}
      {b.receipts.map((r: any) => <p key={r.id}><Link href={`/receipt/${r.id}`}>Receipt {r.number}</Link> · {kes(r.amount)}</p>)}
    </div>))}</>);
}
