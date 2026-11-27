import { Suspense } from "react";
import type { Metadata } from "next";
import { PapersPage } from "@/features/papers/PapersPage";
import { LoadingRows } from "@/components/feedback/States";


export const metadata: Metadata = { title: "Past papers" };

export default function Page() {
  return (
    <>
      <Suspense fallback={<LoadingRows rows={4} />}>
        <PapersPage />
      </Suspense>
    </>
  );
}
