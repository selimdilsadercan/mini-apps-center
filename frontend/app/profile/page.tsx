import { redirect } from "next/navigation";

/** Capacitor / static export fallback — web uses proxy rewrite from /profile → /home/profile */
export default function ProfileRedirectPage() {
  redirect("/home/profile");
}
