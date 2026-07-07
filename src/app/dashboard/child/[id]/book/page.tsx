import BookHub from "@/components/Dashboard/Child/BookHub";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookHub childId={id} />;
}
