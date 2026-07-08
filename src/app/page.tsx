import { WelcomeSplash } from "@/components/WelcomeSplash";
import { getCurrentActor } from "@/lib/auth/session";
import { homePathFor } from "@/lib/authz/policy";

export default async function Home() {
  const actor = await getCurrentActor();
  const target = actor ? homePathFor(actor) : "/login";
  return <WelcomeSplash target={target} loggedIn={Boolean(actor)} />;
}
