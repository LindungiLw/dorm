import { redirect } from "next/navigation";

// Meals moved under the cafeteria section's primary page.
export default function MealsRedirect() {
  redirect("/dashboard/cafeteria/checkin");
}
