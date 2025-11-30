// src/app/(home)/ClientLoader.tsx  (client component)
"use client";

import dynamic from "next/dynamic";
import React from "react";

// dynamic import must run inside a client module
const HomeClient = dynamic(() => import("./HomeClient"), { ssr: false });

export default function ClientLoader() {
  return <HomeClient />;
}
