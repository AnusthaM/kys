"use client";

import { useTransition, useState, useMemo } from "react";
import { useFieldArray, useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  kycSchema,
  KycFormValues,
  DOCUMENT_TYPES,
  PERSONAL_FIELDS,
  FAMILY_GROUPS,
  SELECT_FIELDS,
  STEP_FIELDS,
} from "@/lib/kyc-schema";
import {
  Field,
  FieldGroup,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TextField } from "./text-field";
import { SelectField } from "./select-field";
import { PersonNameFields } from "./person-name-fields";
import { AddressFields } from "./address-fields";
import { DocumentUploadField } from "./document-upload-field";
import { SignatureField } from "./signature-field";
import { DocumentEntry } from "./document-entry";
import { SectionCard } from "./section-card";
import { StepProgress } from "./step-progress";
import { submitKyc, KycActionState } from "@/app/kyc/actions";
import { toast } from "sonner";
import {
  Plus,
  UserRound,
  Users,
  MapPinned,
  ImagePlus,
  FileStack,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const emptyPerson = { firstName: "", middleName: "", lastName: "" };
const emptyAddress = {
  country: "",
  province: "",
  district: "",
  municipality: "",
  city: "",
  ward_no: "",
};

const FAMILY_KEYS = ["father", "mother", "grandFather", "grandMother"] as const;
const ADDRESS_KEYS = ["permanentAddress", "temporaryAddress"] as const;
const EXTRA_FIELDS = ["gender", "martial_status", "occupation"] as const;

const STEP_META = [
  { label: "Personal", icon: UserRound, title: "Personal Details", description: "Your legal name and basic information" },
  { label: "Family", icon: Users, title: "Family Details", description: "Parent and grandparent information" },
  { label: "Address", icon: MapPinned, title: "Address", description: "Permanent and current residence" },
  { label: "Photo & Signature", icon: ImagePlus, title: "Photo & Signature", description: "A clear photo of your face and your signature" },
  { label: "Documents", icon: FileStack, title: "Identity Documents", description: "At least one government-issued document" },
];

export function KycForm() {
  const [state, setState] = useState<KycActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const isLastStep = step === STEP_META.length - 1;

  const { control, handleSubmit, formState, reset, setValue, trigger } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      father: emptyPerson,
      mother: emptyPerson,
      grandFather: emptyPerson,
      grandMother: emptyPerson,
      dob: "",
      email: "",
      phone: "",
      nationality: "",
      gender: "",
      martial_status: "",
      occupation: "",
      permanentAddress: emptyAddress,
      temporaryAddress: emptyAddress,
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "documents" });
  const documents = useWatch({ control, name: "documents" }) ?? [];
  const usedTypes = documents.map((d) => d?.type).filter(Boolean) as string[];
  const watched = useWatch({ control });

  const has = (v: unknown) => typeof v === "string" && v.length > 0;
  const stepStatus = useMemo(
    () => [
      {
        label: "Personal",
        complete: has(watched.firstName) && has(watched.lastName) && has(watched.dob) && has(watched.gender),
      },
      {
        label: "Family",
        complete: has(watched.father?.firstName) && has(watched.mother?.firstName),
      },
      {
        label: "Address",
        complete: has(watched.permanentAddress?.country) && has(watched.temporaryAddress?.country),
      },
      { label: "Photo & Signature", complete: !!watched.photo && !!watched.signature },
      { label: "Documents", complete: (watched.documents?.length ?? 0) > 0 },
    ],
    [watched],
  );

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step] as never, { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, STEP_META.length - 1));
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const goToStep = (index: number) => setStep(index);

  function onValid(values: KycFormValues) {
    const formData = new FormData();

    PERSONAL_FIELDS.forEach(({ name }) => formData.append(name, values[name] ?? ""));
    EXTRA_FIELDS.forEach((name) => formData.append(name, values[name]));

    FAMILY_KEYS.forEach((key) => {
      const person = values[key];
      (["firstName", "middleName", "lastName"] as const).forEach((f) =>
        formData.append(`${key}.${f}`, person?.[f] ?? ""),
      );
    });

    ADDRESS_KEYS.forEach((section) =>
      Object.entries(values[section]).forEach(([key, val]) => formData.append(`${section}.${key}`, val as string)),
    );

    formData.append("photo", values.photo);
    formData.append("signature", values.signature);

    values.documents.forEach((doc, i) => {
      formData.append(`documents[${i}].type`, doc.type);
      formData.append(`documents[${i}].format`, doc.format);
      if (doc.format === "pdf" && doc.file) {
        formData.append(`documents[${i}].file`, doc.file);
      } else {
        if (doc.front) formData.append(`documents[${i}].front`, doc.front);
        if (doc.back) formData.append(`documents[${i}].back`, doc.back);
      }
    });

    startTransition(async () => {
      const result = await submitKyc(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success("KYC submitted successfully");
        reset();
        setStep(0);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  const meta = STEP_META[step];

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Identity Verification
      </div>

      <StepProgress steps={stepStatus} current={step} onStepClick={goToStep} />

      <form
        onSubmit={(e) => {
          if (!isLastStep) return e.preventDefault();
          handleSubmit(onValid)(e);
        }}
        className="space-y-6 pt-6"
      >
        <SectionCard step={String(step + 1)} icon={meta.icon} title={meta.title} description={meta.description}>
          {step === 0 && (
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {PERSONAL_FIELDS.map((f) => (
                <TextField key={f.name} control={control} name={f.name} label={f.label} type={f.type} />
              ))}
              {SELECT_FIELDS.map((f) => (
                <SelectField key={f.name} control={control} name={f.name} label={f.label} options={f.options} />
              ))}
            </FieldGroup>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {FAMILY_GROUPS.map((g) => (
                <PersonNameFields key={g.key} control={control} prefix={g.key} label={g.label} optional={g.optional} />
              ))}
            </div>
          )}

          {step === 2 && <AddressFields control={control} setValue={setValue} />}

          {step === 3 && (
            <div className="space-y-6">
              <Controller
                name="photo"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Photo</FieldLabel>
                    <DocumentUploadField value={field.value} onChange={field.onChange} allowCamera />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="signature"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Signature</FieldLabel>
                    <SignatureField value={field.value} onChange={field.onChange} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          )}

          {step === 4 && (
            <FieldSet className="gap-3">
              <div className="flex items-center justify-between">
                <FieldLegend variant="label" className="sr-only">Documents</FieldLegend>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={usedTypes.length >= DOCUMENT_TYPES.length}
                  onClick={() => append({ type: "", format: "image", front: undefined, back: undefined, file: undefined })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add document
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  No documents added yet.
                </p>
              )}

              {fields.map((field, index) => (
                <DocumentEntry key={field.id} control={control} index={index} usedTypes={usedTypes} onRemove={() => remove(index)} />
              ))}
              {formState.errors.documents?.root && (
                <p className="text-sm text-destructive">{formState.errors.documents.root.message}</p>
              )}
            </FieldSet>
          )}
        </SectionCard>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {isLastStep ? (
            <Button type="submit" disabled={isPending} size="lg" className="flex-1">
              {isPending ? "Submitting..." : "Submit for Verification"}
            </Button>
          ) : (
            <Button type="button" onClick={goNext} className="flex-1">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}