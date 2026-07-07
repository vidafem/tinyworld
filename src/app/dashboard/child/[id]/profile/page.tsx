import ChildProfile from "@/components/Dashboard/Child/ChildProfile";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChildProfile childId={id} />;
}
