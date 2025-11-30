// src/app/(home)/page.tsx  (server component)
import React, { Suspense } from "react";
import ClientLoader from "./ClientLoader";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading app…</div>}>
      <ClientLoader />
    </Suspense>
  );
}
