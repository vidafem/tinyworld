import MemoryHub from "@/components/Dashboard/Child/MemoryHub";

export default async function MemoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemoryHub childId={id} />;
}
