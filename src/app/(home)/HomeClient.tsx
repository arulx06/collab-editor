// src/app/(home)/HomeClient.tsx
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { api } from "../../../convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { useSearchParam } from "@/hooks/use-search-param";
import { Navbar } from "./navbar";

/* ----------------------
   Narrow types for docs table
   ---------------------- */
type DocShape = {
  _id: unknown;
  _creationTime: number;
  title: string;
  ownerId: string;
  leftMargin: number;
  rightMargin: number;
  initialContent?: string;
  roomId?: string;
  organizationId?: string;
};

type DocsProps = {
  documents?: DocShape[] | undefined;
  loadMore: (numItems?: number) => void;
  status?: unknown;
};

/* ----------------------
   Safe dynamic imports (prefer named export, fallback to default)
   Use `unknown` and explicit shapes to avoid `any`.
   ---------------------- */

const TemplateGallary = (dynamic(
  () =>
    import("./template-gallaery").then((mod) => {
      const m = mod as unknown as {
        TemplateGallary?: React.ComponentType<unknown>;
        default?: React.ComponentType<unknown>;
      };
      const Comp = m.TemplateGallary ?? m.default;
      if (!Comp) throw new Error("template-gallaery must export TemplateGallary or a default component");
      return Comp;
    }),
  { ssr: false }
) as unknown) as React.ComponentType<unknown>;

const DocumentsTable = (dynamic(
  () =>
    import("./documents-table").then((mod) => {
      const m = mod as unknown as {
        DocumentsTable?: React.ComponentType<DocsProps>;
        default?: React.ComponentType<DocsProps>;
      };
      const Comp = m.DocumentsTable ?? m.default;
      if (!Comp) throw new Error("documents-table must export DocumentsTable or a default component");
      return Comp;
    }),
  { ssr: false }
) as unknown) as React.ComponentType<DocsProps>;

/* ----------------------
   Home client component
   ---------------------- */

export default function HomeClient(): JSX.Element {
  const [search] = useSearchParam();

  const { results, status, loadMore } = usePaginatedQuery(api.documents.get, { search }, { initialNumItems: 5 });

  // Wrap loadMore to accept optional param; cast safely via unknown to avoid `any`.
  const loadMoreOptional = (n?: number) => {
    const lm = loadMore as unknown as (num?: number | undefined) => void;
    return lm(n);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4">
        <Navbar />
      </div>

      <div className="mt-16">
        <Suspense fallback={<div>Loading templates…</div>}>
          <TemplateGallary />
        </Suspense>

        <Suspense fallback={<div>Loading documents…</div>}>
          <DocumentsTable documents={results} loadMore={loadMoreOptional} status={status} />
        </Suspense>
      </div>
    </div>
  );
}
