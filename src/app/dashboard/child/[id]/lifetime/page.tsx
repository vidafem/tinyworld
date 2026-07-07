import LifetimeHub from "@/components/Dashboard/Child/LifetimeHub";

export default async function LifetimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LifetimeHub childId={id} />;
}
