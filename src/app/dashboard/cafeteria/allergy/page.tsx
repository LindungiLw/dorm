import { getCurrentActor } from "@/lib/auth/session";
import { can } from "@/lib/authz/policy";
import { getAllergenEntries, getMyFoodChoices } from "@/lib/domain/allergy";
import { PageHeader, Card } from "@/components/ui";
import { ModuleSubnav, CAFETERIA_TABS } from "@/components/ModuleSubnav";
import { AllergyBoard } from "@/components/AllergyBoard";

export default async function CafeteriaAllergyPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;

  const canEdit = can(actor, "cafeteria:manageAllergens");
  const [entries, myChoices] = await Promise.all([
    getAllergenEntries(),
    canEdit ? Promise.resolve({}) : getMyFoodChoices(actor.id),
  ]);

  return (
    <div>
      <ModuleSubnav tabs={CAFETERIA_TABS} />
      <PageHeader
        title="Food Allergens"
        subtitle={
          canEdit
            ? "Add the foods the cafeteria serves"
            : "Mark the foods you can eat, or want to avoid"
        }
        icon="⚠️"
      />

      <Card>
        <AllergyBoard entries={entries} canEdit={canEdit} initialChoices={myChoices} />
      </Card>

      {!canEdit && (
        <p className="mt-3 text-center text-xs text-navy-400">
          Foods are listed by cafeteria staff. Your choices are saved to your account.
        </p>
      )}
    </div>
  );
}
