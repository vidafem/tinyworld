import PregnancyHub from "@/components/Dashboard/Child/Pregnancy/PregnancyHub";

export default async function PregnancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PregnancyHub childId={id} />;
}
