"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { kycSchema, KycFormValues, PERSONAL_FIELDS, STEP_FIELDS, ScannedKycData } from "@/lib/kyc-schema";
import { submitKyc, KycActionState } from "@/app/kyc/actions";
import { toast } from "sonner";
import { emptyPerson, emptyAddress, FAMILY_KEYS, ADDRESS_KEYS, EXTRA_FIELDS, STEP_META } from "./kyc-form-config";

const has = (v: unknown) => typeof v === "string" && v.length > 0;

export function useKycForm() {
  const [state, setState] = useState<KycActionState>({ status: "idle" });
  const [showScan, setShowScan] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const isLastStep = step === STEP_META.length - 1;

  const { control, handleSubmit, formState, reset, setValue, trigger } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "", middleName: "", lastName: "",
      father: emptyPerson, mother: emptyPerson, grandFather: emptyPerson, grandMother: emptyPerson,
      dob: "", email: "", phone: "", nationality: "",
      gender: "", martial_status: "", occupation: "",
      permanentAddress: emptyAddress, temporaryAddress: emptyAddress,
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "documents" });

  function applyScannedData(data: ScannedKycData, scannedFile: File) {
    (["firstName", "middleName", "lastName", "dob", "gender", "nationality"] as const).forEach((key) => {
      const value = data[key];
      if (value) setValue(key, value);
    });

    (["father", "mother", "grandFather", "grandMother"] as const).forEach((relKey) => {
      const person = data[relKey];
      if (!person) return;
      (["firstName", "middleName", "lastName"] as const).forEach((f) => {
        const value = person[f];
        if (value) setValue(`${relKey}.${f}`, value);
      });
    });

    if (data.address) {
      (Object.entries(data.address) as [keyof NonNullable<ScannedKycData["address"]>, string][]).forEach(
        ([key, value]) => {
          if (value) setValue(`permanentAddress.${key}`, value);
        },
      );
    }

    if (data.documentType) {
      append({ type: data.documentType, format: "image", front: scannedFile, back: undefined, file: undefined });
    }

    setShowScan(false);
  }

  const documents = useWatch({ control, name: "documents" }) ?? [];
  const usedTypes = documents.map((d) => d?.type).filter(Boolean) as string[];
  const watched = useWatch({ control });

  const stepStatus = useMemo(
    () => [
      { label: "Personal", complete: has(watched.firstName) && has(watched.lastName) && has(watched.dob) && has(watched.gender) },
      { label: "Family", complete: has(watched.father?.firstName) && has(watched.mother?.firstName) },
      { label: "Address", complete: has(watched.permanentAddress?.country) && has(watched.temporaryAddress?.country) },
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

  return {
    control, setValue, formState, handleSubmit, onValid,
    fields, append, remove, usedTypes,
    step, isLastStep, isPending, showScan, setShowScan,
    stepStatus, goNext, goBack, goToStep, applyScannedData,
  };
}