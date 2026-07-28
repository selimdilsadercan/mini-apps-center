import { redirect } from "next/navigation";

/** Capacitor / static export fallback */
export default function EditProfileRedirectPage() {
  redirect("/home/profile/edit");
}
