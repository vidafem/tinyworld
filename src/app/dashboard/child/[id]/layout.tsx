import React from "react";
import { ChildProvider } from "@/context/ChildContext";

export default async function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChildProvider childId={id}>{children}</ChildProvider>;
}
