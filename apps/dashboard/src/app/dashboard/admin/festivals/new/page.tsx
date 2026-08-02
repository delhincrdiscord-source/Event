"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewFestivalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/festivals/new/edit");
  }, [router]);

  return null;
}
