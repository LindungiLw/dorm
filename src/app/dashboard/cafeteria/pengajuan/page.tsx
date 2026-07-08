import { PageHeader, Card } from "@/components/ui";
import { ModuleSubnav, CAFETERIA_TABS } from "@/components/ModuleSubnav";
import { PengajuanForm } from "./PengajuanForm";

export default function PengajuanPage() {
  return (
    <div>
      <ModuleSubnav tabs={CAFETERIA_TABS} />
      <PageHeader
        title="Cafeteria Feedback"
        subtitle="Send feedback or a food complaint"
        icon="📝"
      />
      <Card className="max-w-xl">
        <PengajuanForm />
      </Card>
    </div>
  );
}
