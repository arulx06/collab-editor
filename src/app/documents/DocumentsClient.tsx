"use client";

import { useSearchParams } from "next/navigation";

export default function DocumentsClient() {
  const params = useSearchParams(); // now allowed

  return (
    <div>
      Documents Page — Query Params: {params?.toString()}
    </div>
  );
}
