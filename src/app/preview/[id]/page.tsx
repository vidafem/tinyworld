import PreviewClient from "@/components/Preview/PreviewClient";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PreviewClient childId={id} />;
}
