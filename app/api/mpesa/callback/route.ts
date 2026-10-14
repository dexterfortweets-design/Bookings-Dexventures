import { NextResponse } from "next/server";
import { admin } from "@/lib/server";
const done = () => NextResponse.json({ ResultCode: 0, ResultDesc: "ok" });
export async function POST(req: Request) {
  const cb = (await req.json())?.Body?.stkCallback;
  if (!cb) return done();
  const { data: p } = await admin.from("payments").select("*").eq("checkout_id", cb.CheckoutRequestID).single();
  if (!p || p.status === "paid") return done();
  if (cb.ResultCode !== 0) { await admin.from("payments").update({ status: "failed" }).eq("id", p.id); return done(); }
  const ref = cb.CallbackMetadata.Item.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
  await admin.from("payments").update({ status: "paid", mpesa_ref: ref }).eq("id", p.id);
  const { data: b } = await admin.from("bookings").select("*").eq("id", p.booking_id).single();
  const paid = b.paid + p.amount;
  await admin.from("bookings").update({ paid, status: paid >= b.total ? "paid" : "deposit_paid" }).eq("id", b.id);
  const { data: r } = await admin.from("receipts").insert({ payment_id: p.id, booking_id: b.id, amount: p.amount, balance: b.total - paid }).select().single();
  // Optional automatic merchant copy to the admin's WhatsApp (Meta Cloud API, approved template with 3 body params).
  if (r && process.env.WHATSAPP_TOKEN) {
    await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP, type: "template",
        template: { name: process.env.WHATSAPP_TEMPLATE, language: { code: "en" }, components: [{ type: "body", parameters: [
          { type: "text", text: r.number }, { type: "text", text: `KSh ${p.amount}` }, { type: "text", text: `${process.env.APP_URL}/receipt/${r.id}` }] }] } }),
    }).catch(() => {});
  }
  return done();
}
