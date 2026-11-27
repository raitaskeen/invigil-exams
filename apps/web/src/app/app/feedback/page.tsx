import { Suspense } from "react";
import type { Metadata } from "next";
import { FeedbackPage } from "@/features/feedback/FeedbackPage";
import { LoadingRows } from "@/components/feedback/States";


export const metadata: Metadata = { title: "Feedback hub" };

export default function Page() {
  return (
    <>
      <Suspense fallback={<LoadingRows rows={4} />}>
        <FeedbackPage />
      </Suspense>
    </>
  );
}
