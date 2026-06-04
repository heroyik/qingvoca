import { Suspense } from "react";
import ReviewQuizLoader from "@/components/ReviewQuizLoader";

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex-center min-h-screen font-800">Loading review...</div>}>
      <ReviewQuizLoader />
    </Suspense>
  );
}
