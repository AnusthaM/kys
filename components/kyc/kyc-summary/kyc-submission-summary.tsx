"use client";

import { useState } from "react";
import { KycFormValues } from "@/lib/kyc-schema";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, Download, Loader2 } from "lucide-react";
import { KycReviewSummary } from "./kyc-review-summary";
import { generateSubmissionPdf } from "@/lib/submission-pdf";

interface KycSubmissionSummaryProps {
  data: KycFormValues;
  submissionId?: string;
  onStartOver: () => void;
}

export function KycSubmissionSummary({ data, submissionId, onStartOver }: KycSubmissionSummaryProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      await generateSubmissionPdf(data, submissionId);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">Submission received</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            {submissionId ? `Reference ID: ${submissionId}` : "Here's what was submitted for verification."}
          </p>
        </div>
      </div>

      <KycReviewSummary data={data} />

      <div className="flex gap-3">
        <Button type="button" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="flex-1">
          {isGeneratingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Download as PDF
            </>
          )}
        </Button>
        <Button type="button" onClick={onStartOver} variant="outline" className="flex-1">
          <RotateCcw className="mr-2 h-4 w-4" /> Start a new submission
        </Button>
      </div>
    </div>
  );
}