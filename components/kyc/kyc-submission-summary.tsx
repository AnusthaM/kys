"use client";

import { useEffect, useState } from "react";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  RotateCcw,
  FileText,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";
import { ZoomableImage } from "./zoomable-image";
import { SummarySection, SummaryRow } from "./summary-section";
import { generateSubmissionPdf } from "@/lib/submission-pdf";

type Person = { firstName?: string; middleName?: string; lastName?: string };
type Address = {
  country?: string;
  province?: string;
  district?: string;
  city?: string;
  ward_no?: string;
};
type Rows = [string, string | undefined][];

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
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {file.type.startsWith("image/") && url ? (
        <ZoomableImage src={url} alt={label} className="h-24 w-32" />
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-24 w-32 items-center justify-center gap-2 rounded border bg-muted text-xs text-muted-foreground">
            <FileText className="h-4 w-4 truncate" /> {file.name}
          </div>
          {url && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank")}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const AddressBlock = ({ title, addr }: { title: string; addr?: Address }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-muted-foreground">{title}</p>
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
);

interface KycSubmissionSummaryProps {
  data: KycFormValues;
  submissionId?: string;
  onStartOver: () => void;
}

export function KycSubmissionSummary({
  data,
  submissionId,
  onStartOver,
}: KycSubmissionSummaryProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      await generateSubmissionPdf(data, submissionId);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

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
          [
            "Spouse",
            [data.spouseFirstName, data.spouseLastName]
              .filter(Boolean)
              .join(" "),
          ],
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">
            Submission received
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            {submissionId
              ? `Reference ID: ${submissionId}`
              : "Here's what was submitted for verification."}
          </p>
        </div>
      </div>

      <SummarySection title="Personal Details">
        <div className="grid grid-cols-2 gap-4">
          <RowList rows={personalRows} />
        </div>
      </SummarySection>

      <SummarySection title="Family Details">
        <div className="grid grid-cols-2 gap-4">
          <RowList rows={familyRows} />
        </div>
      </SummarySection>

      <SummarySection title="Address">
        <div className="grid grid-cols-2 gap-6">
          <AddressBlock title="Permanent" addr={data.permanentAddress} />
          <AddressBlock title="Temporary" addr={data.temporaryAddress} />
        </div>
      </SummarySection>

      <SummarySection title="Photo & Signature">
        <div className="flex gap-6">
          <FileThumb file={data.photo} label="Photo" />
          <FileThumb file={data.signature} label="Signature" />
        </div>
      </SummarySection>

      <SummarySection title={`Documents (${data.documents.length})`}>
        <div className="space-y-4">
          {data.documents.map((doc, i) => {
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
              <div
                key={i}
                className="space-y-2 border-t pt-4 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label ??
                      doc.type}
                  </p>
                  {doc.idNumber && (
                    <p className="text-xs text-muted-foreground">
                      ID: {doc.idNumber}
                    </p>
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

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex-1"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
              PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Download as PDF
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={onStartOver}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Start a new submission
        </Button>
      </div>
    </div>
  );
}
