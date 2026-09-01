"use client";

import { useState } from "react";
import { KycFormValues } from "@/lib/kyc-schema";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, Download, Loader2, Copy, Check } from "lucide-react";
import { KycReviewSummary } from "./kyc-review-summary";
import { generateSubmissionPdf } from "@/lib/submission-pdf";

interface KycSubmissionSummaryProps {
  data: KycFormValues;
  submissionId?: string;
  onStartOver: () => void;
}

export function KycSubmissionSummary({ data, submissionId, onStartOver }: KycSubmissionSummaryProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      await generateSubmissionPdf(data, submissionId);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleCopyId() {
    if (!submissionId) return;
    navigator.clipboard.writeText(submissionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/40 via-background to-background pb-28">
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-12 sm:px-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
            <div className="absolute inset-0 rounded-full bg-emerald-200" />
            <CheckCircle2 className="relative h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Submission received</h1>
            <p className="text-sm text-muted-foreground">
              We&#39;ve got everything we need. Here&apos;s a copy of what was submitted for verification.
            </p>
          </div>

          {submissionId && (
            <button
              type="button"
              onClick={handleCopyId}
              className="group flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm shadow-sm transition-colors hover:border-primary/40"
            >
              <span className="text-muted-foreground">Reference ID</span>
              <span className="font-mono font-medium">{submissionId}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Review */}
        <KycReviewSummary data={data} />
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-4 sm:px-8">
          <Button
            type="button"
            onClick={onStartOver}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Start a new submission
          </Button>
          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            size="lg"
            className="flex-1 shadow-sm"
          >
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
        </div>
      </div>
    </div>
  );
}