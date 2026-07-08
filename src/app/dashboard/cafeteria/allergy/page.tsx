import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getAllergenEntries } from "@/lib/domain/allergy";
import { PageHeader, Card } from "@/components/ui";
import { ModuleSubnav, CAFETERIA_TABS } from "@/components/ModuleSubnav";
import { AllergyBoard } from "@/components/AllergyBoard";

export default async function CafeteriaAllergyPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const canEdit = can(actor, "cafeteria:manageAllergens");
  const entries = await getAllergenEntries();

  return (
    <div>
      <ModuleSubnav tabs={CAFETERIA_TABS} />
      <PageHeader
        title="Food Allergens"
        subtitle={
          canEdit
            ? "Maintain the list of dishes and the allergens each one contains"
            : "Dishes served and the allergens they contain — check before you eat"
        }
        icon="⚠️"
      />

      <Card>
        <AllergyBoard entries={entries} canEdit={canEdit} />
      </Card>

      {!canEdit && (
        <p className="mt-3 text-center text-xs text-navy-400">
          This list is maintained by cafeteria staff.
        </p>
      )}
    </div>
  );
}
