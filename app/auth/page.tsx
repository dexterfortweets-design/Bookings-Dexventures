"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function Auth() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  async function go() {
    setMsg("");
    const r = mode === "up"
      ? await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name, phone: f.phone } } })
      : await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    if (r.error) return setMsg(r.error.message);
    if (r.data.session) location.href = "/"; else setMsg("Check your email to confirm your account, then log in.");
  }
  return (<div className="card">
    <h2>{mode === "up" ? "Create your account" : "Log in"}</h2>
    {mode === "up" && <><label>Full name<input value={f.name} onChange={set("name")} /></label>
      <label>Phone (M-Pesa)<input value={f.phone} onChange={set("phone")} placeholder="07XX XXX XXX" /></label></>}
    <label>Email<input type="email" value={f.email} onChange={set("email")} /></label>
    <label>Password<input type="password" value={f.password} onChange={set("password")} /></label>
    <p className="err">{msg}</p>
    <button onClick={go}>{mode === "up" ? "Create account" : "Log in"}</button>{" "}
    <button style={{ background: "#4a5f80" }} onClick={() => setMode(mode === "up" ? "in" : "up")}>{mode === "up" ? "I have an account" : "I need an account"}</button>{" "}
    <button style={{ background: "#4a5f80" }} onClick={() => supabase.auth.signOut().then(() => location.reload())}>Log out</button>
  </div>);
}
