"use client";

import { useParams } from "next/navigation";
import CalendarVault from "@/components/Dashboard/Child/CalendarVault";

export default function CalendarVaultPage() {
  const params = useParams();
  const id = params.id as string;

  return <CalendarVault childId={id} />;
}
