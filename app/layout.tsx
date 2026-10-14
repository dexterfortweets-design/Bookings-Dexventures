import "./globals.css";
import Link from "next/link";
export const metadata = { title: "Dex Ventures Tours and Travel" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>
    <nav><b>DEX <span>VENTURES</span></b><Link href="/">Trips</Link><Link href="/bookings">My bookings</Link><Link href="/admin">Admin</Link><Link href="/auth">Account</Link></nav>
    <main>{children}</main></body></html>);
}
