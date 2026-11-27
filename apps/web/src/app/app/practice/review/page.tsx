import { Suspense } from "react";
import type { Metadata } from "next";
import { PracticeReviewPage } from "@/features/practice/PracticePage";
import { LoadingRows } from "@/components/feedback/States";
import { RequirePermission } from "@/lib/route-guards";

export const metadata: Metadata = { title: "Practice review" };

export default function Page() {
  return (
    <RequirePermission permission="exams:take">
      <Suspense fallback={<LoadingRows rows={4} />}>
        <PracticeReviewPage />
      </Suspense>
    </RequirePermission>
  );
}
