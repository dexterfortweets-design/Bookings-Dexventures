const base = process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
export const msisdn = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("254") ? d : "254" + d.replace(/^0/, ""); };
export async function stkPush(phone: string, amount: number, ref: string) {
  const auth = Buffer.from(`${process.env.MPESA_KEY}:${process.env.MPESA_SECRET}`).toString("base64");
  const { access_token } = await (await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } })).json();
  const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const sc = process.env.MPESA_SHORTCODE!;
  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST", headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ BusinessShortCode: sc, Password: Buffer.from(sc + process.env.MPESA_PASSKEY + ts).toString("base64"), Timestamp: ts,
      TransactionType: "CustomerPayBillOnline", Amount: amount, PartyA: msisdn(phone), PartyB: sc, PhoneNumber: msisdn(phone),
      CallBackURL: `${process.env.APP_URL}/api/mpesa/callback`, AccountReference: ref, TransactionDesc: "Dex Ventures trip" }),
  });
  return res.json();
}
