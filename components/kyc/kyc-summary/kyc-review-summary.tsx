"use client";

import { useEffect, useState } from "react";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, User, Users, MapPin, ImageIcon, FolderOpen } from "lucide-react";
import { ZoomableImage } from "../common/zoomable-image";
import { SummarySection, SummaryRow } from "./summary-section";

type Person = { firstName?: string; middleName?: string; lastName?: string };
type Address = {
  country?: string;
  province?: string;
  district?: string;
  city?: string;
  ward_no?: string;
};
type Rows = [string, string | undefined][];
type DeepPartial<T> = T extends File
  ? T
  : T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

const fullName = (p?: Person) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");

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

function RowList({ rows }: { rows: Rows }) {
  return (
    <>
      {rows.map(([label, value]) => (
        <SummaryRow key={label} label={label} value={value} />
      ))}
    </>
  );
}

function FileThumb({ file, label }: { file: File | undefined; label: string }) {
  const url = useObjectUrl(file);
  if (!file) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {file.type.startsWith("image/") && url ? (
        <ZoomableImage src={url} alt={label} className="h-24 w-32 rounded-lg border" />
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-24 w-32 items-center justify-center gap-2 rounded-lg border bg-muted/50 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" /> <span className="min-w-0 truncate px-1">{file.name}</span>
          </div>
          {url && (
            <Button type="button" variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const AddressBlock = ({ title, addr }: { title: string; addr?: Address }) => (
  <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    <div className="grid grid-cols-2 gap-3">
      <RowList
        rows={[
          ["Country", addr?.country],
          ["Province", addr?.province],
          ["District", addr?.district],
          ["City", addr?.city],
          ["Ward No.", addr?.ward_no],
        ]}
      />
    </div>
  </div>
);

interface KycReviewSummaryProps {
  data: DeepPartial<KycFormValues>;
}

export function KycReviewSummary({ data }: KycReviewSummaryProps) {
  const personalRows: Rows = [
    ["Full Name", fullName(data)],
    ["Date of Birth", data.dob],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Nationality", data.nationality],
    ["Gender", data.gender],
    ["Marital Status", data.martial_status],
    ["Occupation", data.occupation],
    ...(data.martial_status === "married"
      ? ([
          ["Spouse", [data.spouseFirstName, data.spouseLastName].filter(Boolean).join(" ")],
          ["Spouse Age", data.spouseAge],
        ] as Rows)
      : []),
  ];

  const familyRows: Rows = [
    ["Father", fullName(data.father)],
    ["Mother", fullName(data.mother)],
    ["Grandfather", fullName(data.grandFather)],
    ["Grandmother", fullName(data.grandMother)],
  ];

  const documents = data.documents ?? [];

  return (
    <div className="space-y-6">
      <SummarySection title="Personal Details" icon={User}>
        <div className="grid grid-cols-2 gap-4">
          <RowList rows={personalRows} />
        </div>
      </SummarySection>

      <SummarySection title="Family Details" icon={Users}>
        <div className="grid grid-cols-2 gap-4">
          <RowList rows={familyRows} />
        </div>
      </SummarySection>

      <SummarySection title="Address" icon={MapPin}>
        <div className="grid grid-cols-2 gap-4">
          <AddressBlock title="Permanent" addr={data.permanentAddress} />
          <AddressBlock title="Temporary" addr={data.temporaryAddress} />
        </div>
      </SummarySection>

      <SummarySection title="Photo & Signature" icon={ImageIcon}>
        <div className="flex gap-6">
          <FileThumb file={data.photo} label="Photo" />
          <FileThumb file={data.signature} label="Signature" />
        </div>
      </SummarySection>

      <SummarySection title={`Documents (${documents.length})`} icon={FolderOpen}>
        <div className="space-y-3">
          {documents.length === 0 && (
            <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              No documents added.
            </p>
          )}
          {documents.map((doc, i) => {
            const docRows: Rows = [
              ["Issue Date", doc.issueDate],
              ["Expiry Date", doc.expiryDate],
            ];
            const informantName = fullName({
              firstName: doc.informantFirstName,
              middleName: doc.informantMiddleName,
              lastName: doc.informantLastName,
            });

            return (
              <div key={i} className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label ?? doc.type}
                  </p>
                  {doc.idNumber && (
                    <p className="text-xs text-muted-foreground">ID: {doc.idNumber}</p>
                  )}
                </div>
                {doc.format === "pdf" ? (
                  <FileThumb file={doc.file} label="Document" />
                ) : (
                  <div className="flex gap-3">
                    <FileThumb file={doc.front} label="Front" />
                    <FileThumb file={doc.back} label="Back" />
                  </div>
                )}
                {(doc.issueDate || doc.expiryDate) && (
                  <div className="flex gap-6">
                    <RowList rows={docRows} />
                  </div>
                )}
                {doc.informantFirstName && (
                  <SummaryRow
                    label={`Informant (${doc.informantRelationship ?? "—"})`}
                    value={informantName}
                  />
                )}
              </div>
            );
          })}
        </div>
      </SummarySection>
    </div>
  );
}