"use client";

import { useEffect } from "react";
import { trackViewProduct } from "@/lib/analytics";

export function TrackProductView({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category?: string;
}) {
  useEffect(() => {
    trackViewProduct({ slug, name, category });
  }, [slug, name, category]);
  return null;
}
