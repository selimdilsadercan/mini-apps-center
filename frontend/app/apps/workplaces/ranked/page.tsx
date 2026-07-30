import { redirect } from "next/navigation";

/** Ranked lives in the places-ranked mini-app, not under workplaces routes */
export default function WorkplacesRankedRedirect() {
  redirect("/apps/places-ranked");
}
