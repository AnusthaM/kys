"use client";

import { useState, useTransition, useMemo } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  kycSchema,
  KycFormValues,
  STEP_FIELDS,
  ScannedKycData,
  DocumentTypeValue,
} from "@/lib/kyc-schema";
import { submitKyc, KycActionState } from "@/app/kyc/actions";
import { toast } from "sonner";
import {
  emptyPerson,
  emptyAddress,
  STEP_META,
} from "./kyc-form-config";
import { buildKycFormData } from "./build-form-data";

const has = (v: unknown) => typeof v === "string" && v.length > 0;

const PRIMARY_ID_FIELD: Record<DocumentTypeValue, keyof ScannedKycData> = {
  pan_card: "panNo",
  drivers_license: "licenseNo",
  birth_certificate: "birthRegistrationNo",
  citizenship: "citizenshipNo",
  passport: "passportNo",
  national_id: "nationalIdNo",
};

export function useKycForm() {
  const [state, setState] = useState<KycActionState>({ status: "idle" });
  const [showScan, setShowScan] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const isLastStep = step === STEP_META.length - 1;
  const [submittedData, setSubmittedData] = useState<KycFormValues | null>(
    null,
  );
  const [submissionId, setSubmissionId] = useState<string | undefined>();

  const {
    control,
    handleSubmit,
    formState,
    reset,
    setValue,
    trigger,
    getValues,
  } = useForm<KycFormValues>({
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
      spouseFirstName: "",
      spouseLastName: "",
      spouseAge: "",
      permanentAddress: emptyAddress,
      temporaryAddress: emptyAddress,
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents",
  });

  function applyScannedData(
    data: ScannedKycData,
    frontFile: File,
    backFile?: File,
  ) {
    (
      [
        "firstName",
        "middleName",
        "lastName",
        "dob",
        "gender",
        "nationality",
      ] as const
    ).forEach((key) => {
      const value = data[key];
      if (value) setValue(key, value);
    });

    if (data.contactNo) setValue("phone", data.contactNo);

    (["father", "mother", "grandFather", "grandMother"] as const).forEach(
      (relKey) => {
        const person = data[relKey];
        if (!person) return;
        (["firstName", "middleName", "lastName"] as const).forEach((f) => {
          const value = person[f];
          if (value) setValue(`${relKey}.${f}`, value);
        });
      },
    );

    if (data.address) {
      (
        Object.entries(data.address) as [
          keyof NonNullable<ScannedKycData["address"]>,
          string,
        ][]
      ).forEach(([key, value]) => {
        if (value) setValue(`permanentAddress.${key}`, value);
      });
    }

    if (data.documentType) {
      const documentType = data.documentType;
      const isPdf = frontFile.type === "application/pdf";
      const newIndex = fields.length;

      append({
        type: documentType,
        format: isPdf ? "pdf" : "image",
        front: isPdf ? undefined : frontFile,
        back: isPdf ? undefined : backFile,
        file: isPdf ? frontFile : undefined,
        fromScan: true, // ← the only source of truth for "this doc is locked"
      });

      const idNumber = data[PRIMARY_ID_FIELD[documentType]] as
        | string
        | undefined;
      if (idNumber) setValue(`documents.${newIndex}.idNumber`, idNumber);
      if (data.issueDate)
        setValue(`documents.${newIndex}.issueDate`, data.issueDate);
      if (data.expiryDate)
        setValue(`documents.${newIndex}.expiryDate`, data.expiryDate);

      if (data.informant?.firstName)
        setValue(
          `documents.${newIndex}.informantFirstName`,
          data.informant.firstName,
        );
      if (data.informant?.middleName)
        setValue(
          `documents.${newIndex}.informantMiddleName`,
          data.informant.middleName,
        );
      if (data.informant?.lastName)
        setValue(
          `documents.${newIndex}.informantLastName`,
          data.informant.lastName,
        );
      if (data.informantRelationship)
        setValue(
          `documents.${newIndex}.informantRelationship`,
          data.informantRelationship,
        );
    }

    setShowScan(false);
  }

  function addManualDocument() {
    append({
      type: "",
      format: "image",
      front: undefined,
      back: undefined,
      file: undefined,
      fromScan: false, // explicit — never locked
    });
  }

  const documents = useWatch({ control, name: "documents" }) ?? [];
  const usedTypes = documents.map((d) => d?.type).filter(Boolean) as string[];
  const watched = useWatch({ control });

  const stepStatus = useMemo(
    () => [
      {
        label: "Personal",
        complete:
          has(watched.firstName) &&
          has(watched.lastName) &&
          has(watched.dob) &&
          has(watched.gender) &&
          (watched.martial_status !== "married" ||
            (has(watched.spouseFirstName) &&
              has(watched.spouseLastName) &&
              has(watched.spouseAge))),
      },
      {
        label: "Family",
        complete:
          has(watched.father?.firstName) && has(watched.mother?.firstName),
      },
      {
        label: "Address",
        complete:
          has(watched.permanentAddress?.country) &&
          has(watched.temporaryAddress?.country),
      },
      {
        label: "Photo & Signature",
        complete: !!watched.photo && !!watched.signature,
      },
      { label: "Documents", complete: (watched.documents?.length ?? 0) > 0 },
      { label: "Review", complete: false }, // only "complete" once actually submitted
    ],
    [watched],
  );

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step] as never, {
      shouldFocus: true,
    });
    if (!valid) return;

    if (step === 0) {
      const values = getValues();
      if (values.martial_status === "married") {
        const missingSpouseInfo =
          !values.spouseFirstName ||
          !values.spouseLastName ||
          !values.spouseAge;
        if (missingSpouseInfo) {
          toast.error("Please fill in spouse details before continuing.");
          return;
        }
      }
    }
    setStep((s) => Math.min(s + 1, STEP_META.length - 1));
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const goToStep = (index: number) => setStep(index);

  function onValid(values: KycFormValues) {
    const formData = buildKycFormData(values);

    startTransition(async () => {
      const result = await submitKyc(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success("KYC submitted successfully");
        setSubmittedData(values);
        setSubmissionId(result.submissionId);
        reset();
        setStep(0);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  // Runs when handleSubmit's own client-side validation fails —
  // this is what was silently doing nothing before.
  function onInvalid(errors: FieldErrors<KycFormValues>) {
    if (errors.documents) {
      toast.error(
        "One of your documents is missing required info — check the front/back image and ID number.",
      );
    } else {
      toast.error("Please fill in all required fields before submitting.");
    }
  }

  function startOver() {
    setSubmittedData(null);
    setSubmissionId(undefined);
    setShowScan(true);
  }

  return {
    control,
    setValue,
    formState,
    handleSubmit,
    onValid,
    onInvalid,
    fields,
    append: addManualDocument,
    remove,
    usedTypes,
    step,
    isLastStep,
    isPending,
    showScan,
    setShowScan,
    stepStatus,
    goNext,
    goBack,
    goToStep,
    applyScannedData,
    startOver,
    submittedData,
    submissionId,
  };
}