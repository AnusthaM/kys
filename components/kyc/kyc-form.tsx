"use client";

import { ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./common/section-card";
import { StepProgress } from "./steps/step-progress";
import ScanStep from "./steps/scan-step";
import { KycStepFields } from "./steps/kyc-step-fields";
import { KycSubmissionSummary } from "./kyc-summary/kyc-submission-summary";
import { useKycForm } from "./kyc-config/use-kyc-form";
import { STEP_META } from "./kyc-config/kyc-form-config";

export function KycForm() {
  const {
    control, setValue, formState, handleSubmit, onValid, onInvalid,
    fields, append, remove, usedTypes,
    step, isLastStep, isPending, showScan, setShowScan,
    stepStatus, goNext, goBack, goToStep, applyScannedData,
    submittedData, submissionId, startOver,
  } = useKycForm();

  if (submittedData) {
    return <KycSubmissionSummary data={submittedData} submissionId={submissionId} onStartOver={startOver} />;
  }

  const meta = STEP_META[step];

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/40 via-background to-background px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Identity Verification</h1>
            <p className="text-sm text-muted-foreground">
              A few quick steps to confirm it&apos;s really you.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-sm">
          {showScan ? (
            <div className="p-6 sm:p-8">
              <ScanStep onScanned={applyScannedData} onSkip={() => setShowScan(false)} />
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <StepProgress steps={stepStatus} current={step} onStepClick={goToStep} />

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pt-6">
                <div
                  key={step}
                  className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  <SectionCard
                    step={String(step + 1)}
                    icon={meta.icon}
                    title={meta.title}
                    description={meta.description}
                  >
                    <KycStepFields
                      step={step}
                      control={control}
                      setValue={setValue}
                      fields={fields}
                      usedTypes={usedTypes}
                      formState={formState}
                      onAddDocument={append}
                      onRemoveDocument={remove}
                    />
                  </SectionCard>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 0}
                    className="shrink-0"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>

                  {isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleSubmit(onValid, onInvalid)}
                      disabled={isPending}
                      size="lg"
                      className="flex-1 shadow-sm"
                    >
                      {isPending ? "Submitting..." : "Submit for Verification"}
                    </Button>
                  ) : (
                    <Button type="button" onClick={goNext} size="lg" className="flex-1 shadow-sm">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your information is encrypted and only used for verification purposes.
        </p>
      </div>
    </div>
  );
}