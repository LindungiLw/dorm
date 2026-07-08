import { redirect } from "next/navigation";

// Permissions moved under the permission section's primary page.
export default function PermissionsRedirect() {
  redirect("/dashboard/permission/exit");
}
