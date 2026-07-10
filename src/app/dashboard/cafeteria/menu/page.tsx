import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { todayStr } from "@/lib/time";
import { getAllMenu } from "@/lib/domain/menu";
import { PageHeader } from "@/components/ui";
import { ModuleSubnav, CAFETERIA_TABS } from "@/components/ModuleSubnav";
import { MenuCalendar } from "@/components/MenuCalendar";

export default async function CafeteriaMenuPage() {
  // The menu load doesn't depend on the actor, so fetch both at once.
  const [actor, menu] = await Promise.all([getCurrentActor(), getAllMenu()]);
  if (!actor) return null;

  const canEdit = can(actor, "cafeteria:manageMenu");

  return (
    <div>
      <ModuleSubnav tabs={CAFETERIA_TABS} />
      <PageHeader
        title="Cafeteria Menu"
        subtitle={
          canEdit
            ? "Pick a date to view or update the food served"
            : "Pick a date to see what's being served"
        }
        icon="🍽️"
      />

      <MenuCalendar menu={menu} canEdit={canEdit} today={todayStr()} />

      {!canEdit && (
        <p className="mt-3 text-center text-xs text-navy-400">
          Menu editing is available to cafeteria staff.
        </p>
      )}
    </div>
  );
}
