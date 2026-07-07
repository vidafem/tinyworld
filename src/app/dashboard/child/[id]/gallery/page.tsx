import GlobalGallery from "@/components/Dashboard/Child/GlobalGallery";

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GlobalGallery childId={id} />;
}
