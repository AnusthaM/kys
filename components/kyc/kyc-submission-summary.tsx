"use client";

import { useEffect, useState } from "react";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, FileText } from "lucide-react";
import Image from "next/image";

interface KycSubmissionSummaryProps {
  data: KycFormValues;
  submissionId?: string;
  onStartOver: () => void;
}

function useObjectUrl(file: File | undefined | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local preview state to a browser File
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function PersonSummary({ label, person }: { label: string; person?: { firstName?: string; middleName?: string; lastName?: string } }) {
  if (!person?.firstName && !person?.lastName) return null;
  const name = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
  return <SummaryRow label={label} value={name} />;
}

function ImageThumb({ file, label }: { file: File | undefined; label: string }) {
  const url = useObjectUrl(file);
  if (!file) return null;
  const isImage = file.type.startsWith("image/");
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {isImage && url ? (
        <div className="relative h-24 w-32 overflow-hidden rounded border bg-white">
          <Image src={url} alt={label} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="flex h-24 w-32 items-center justify-center gap-2 rounded border bg-muted text-xs text-muted-foreground">
          <FileText className="h-4 w-4" /> {file.name}
        </div>
      )}
    </div>
  );
}

export function KycSubmissionSummary({ data, submissionId, onStartOver }: KycSubmissionSummaryProps) {
  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");

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

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <SummaryRow label="Full Name" value={fullName} />
          <SummaryRow label="Date of Birth" value={data.dob} />
          <SummaryRow label="Email" value={data.email} />
          <SummaryRow label="Phone" value={data.phone} />
          <SummaryRow label="Nationality" value={data.nationality} />
          <SummaryRow label="Gender" value={data.gender} />
          <SummaryRow label="Marital Status" value={data.martial_status} />
          <SummaryRow label="Occupation" value={data.occupation} />
          {data.martial_status === "married" && (
            <>
              <SummaryRow
                label="Spouse"
                value={[data.spouseFirstName, data.spouseLastName].filter(Boolean).join(" ")}
              />
              <SummaryRow label="Spouse Age" value={data.spouseAge} />
            </>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Family Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <PersonSummary label="Father" person={data.father} />
          <PersonSummary label="Mother" person={data.mother} />
          <PersonSummary label="Grandfather" person={data.grandFather} />
          <PersonSummary label="Grandmother" person={data.grandMother} />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Address</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Permanent</p>
            <SummaryRow label="Country" value={data.permanentAddress?.country} />
            <SummaryRow label="Province" value={data.permanentAddress?.province} />
            <SummaryRow label="District" value={data.permanentAddress?.district} />
            <SummaryRow label="City" value={data.permanentAddress?.city} />
            <SummaryRow label="Ward No." value={data.permanentAddress?.ward_no} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Temporary</p>
            <SummaryRow label="Country" value={data.temporaryAddress?.country} />
            <SummaryRow label="Province" value={data.temporaryAddress?.province} />
            <SummaryRow label="District" value={data.temporaryAddress?.district} />
            <SummaryRow label="City" value={data.temporaryAddress?.city} />
            <SummaryRow label="Ward No." value={data.temporaryAddress?.ward_no} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Photo & Signature</h3>
        <div className="flex gap-6">
          <ImageThumb file={data.photo} label="Photo" />
          <ImageThumb file={data.signature} label="Signature" />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">Documents ({data.documents.length})</h3>
        <div className="space-y-4">
          {data.documents.map((doc, i) => {
            const config = DOCUMENT_TYPES.find((d) => d.value === doc.type);
            return (
              <div key={i} className="space-y-2 border-t pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{config?.label ?? doc.type}</p>
                  {doc.idNumber && <p className="text-xs text-muted-foreground">ID: {doc.idNumber}</p>}
                </div>
                {doc.format === "pdf" ? (
                  <ImageThumb file={doc.file} label="Document" />
                ) : (
                  <div className="flex gap-3">
                    <ImageThumb file={doc.front} label="Front" />
                    <ImageThumb file={doc.back} label="Back" />
                  </div>
                )}
                {(doc.issueDate || doc.expiryDate) && (
                  <div className="flex gap-6">
                    <SummaryRow label="Issue Date" value={doc.issueDate} />
                    <SummaryRow label="Expiry Date" value={doc.expiryDate} />
                  </div>
                )}
                {doc.informantFirstName && (
                  <SummaryRow
                    label={`Informant (${doc.informantRelationship ?? "—"})`}
                    value={[doc.informantFirstName, doc.informantMiddleName, doc.informantLastName].filter(Boolean).join(" ")}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Button type="button" onClick={onStartOver} className="w-full" variant="outline">
        <RotateCcw className="mr-2 h-4 w-4" /> Start a new submission
      </Button>
    </div>
  );
}