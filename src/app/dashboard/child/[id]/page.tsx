import ChildHub from "@/components/Dashboard/Child/ChildHub";

export default async function ChildDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChildHub childId={id} />;
}
