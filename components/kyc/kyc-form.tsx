"use client";

import { ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";
import { StepProgress } from "./steps/step-progress";
import ScanStep from "./steps/scan-step";
import { KycStepFields } from "./steps/kyc-step-fields";
import { KycSubmissionSummary } from "./kyc-submission-summary";
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
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Identity Verification
      </div>

      {showScan ? (
        <ScanStep onScanned={applyScannedData} onSkip={() => setShowScan(false)} />
      ) : (
        <>
          <StepProgress steps={stepStatus} current={step} onStepClick={goToStep} />
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pt-6">
            <SectionCard step={String(step + 1)} icon={meta.icon} title={meta.title} description={meta.description}>
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

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {isLastStep ? (
                <Button type="button" onClick={handleSubmit(onValid, onInvalid)} disabled={isPending} size="lg" className="flex-1">
                  {isPending ? "Submitting..." : "Submit for Verification"}
                </Button>
              ) : (
                <Button type="button" onClick={goNext} className="flex-1">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}