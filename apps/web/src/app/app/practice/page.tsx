import { Suspense } from "react";
import type { Metadata } from "next";
import { PracticePage } from "@/features/practice/PracticePage";
import { LoadingRows } from "@/components/feedback/States";
import { RequirePermission } from "@/lib/route-guards";

export const metadata: Metadata = { title: "Practice tests" };

export default function Page() {
  return (
    <RequirePermission permission="exams:take">
      <Suspense fallback={<LoadingRows rows={4} />}>
        <PracticePage />
      </Suspense>
    </RequirePermission>
  );
}
