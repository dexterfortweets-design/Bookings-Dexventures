import { NextResponse } from "next/server";
import { admin } from "@/lib/server";
import { stkPush } from "@/lib/mpesa";
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });
export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return err("Sign in to pay", 401);
  const { bookingId, kind, phone } = await req.json();
  const { data: b } = await admin.from("bookings").select("*").eq("id", bookingId).eq("user_id", user.id).single();
  if (!b) return err("Booking not found", 404);
  if (kind === "deposit" && b.status !== "pending") return err("Deposit already paid or booking expired");
  if (kind === "balance" && b.status !== "deposit_paid") return err("Pay the deposit first");
  const amount = kind === "deposit" ? b.deposit : b.total - b.paid;
  const { data: p } = await admin.from("payments").insert({ booking_id: b.id, amount, kind, phone }).select().single();
  const r = await stkPush(phone, amount, "DEX" + b.id.slice(0, 6));
  if (!r.CheckoutRequestID) return err(r.errorMessage || "M-Pesa request failed", 502);
  await admin.from("payments").update({ checkout_id: r.CheckoutRequestID }).eq("id", p!.id);
  return NextResponse.json({ ok: true });
}
