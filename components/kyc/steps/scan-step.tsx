"use client"
import { ScanActionState, scanDocument } from "@/app/kyc/actions";
import { DOCUMENT_TYPES, DocumentTypeValue, DocumentFormat, ScannedKycData } from "@/lib/kyc-schema";
import { useState, useTransition } from 'react';
import { toast } from "sonner";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { DocumentUploadField } from '../documents/document-upload-field';
import { ScanLine, ArrowRight, Loader2 } from "lucide-react";

interface ScanStepProps {
    onScanned: (data: ScannedKycData, front: File, back?: File) => void
    onSkip: () => void
}

export default function ScanStep({ onScanned, onSkip }: ScanStepProps) {
    const [documentType, setDocumentType] = useState<DocumentTypeValue | "">("");
    const [format, setFormat] = useState<DocumentFormat>("image");
    const [frontFile, setFrontFile] = useState<File | undefined>();
    const [backFile, setBackFile] = useState<File | undefined>();
    const [isPending, startTransition] = useTransition();

    const config = DOCUMENT_TYPES.find((d) => d.value === documentType);
    const needsBack = format === "image" && !!config?.requiresBack;
    const canScan = !!documentType && !!frontFile && (!needsBack || !!backFile);

    function resetFiles() {
        setFrontFile(undefined);
        setBackFile(undefined);
    }

    function handleScan() {
        if (!canScan || !frontFile) return;
        const formData = new FormData()
        formData.append("document", frontFile)
        formData.append("documentType", documentType)
        formData.append("format", format)

        startTransition(async () => {
            const result: ScanActionState = await scanDocument(formData)
            if (result.status === "success") {
                toast.success("Document scanned - review the details below")
                onScanned(result.data, frontFile, format === "image" ? backFile : undefined)
            } else if (result.status === "error") {
                toast.error(result.message)
            }
        })
    }

  return (
    <Card className="mx-auto max-w-lg space-y-5 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ScanLine className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-none">Scan your ID</h2>
          <p className="text-sm text-muted-foreground">We&apos;ll auto-fill your details from it</p>
        </div>
      </div>

      <Field>
        <FieldLabel>Document type</FieldLabel>
        <Select
          value={documentType}
          onValueChange={(v) => { setDocumentType(v as DocumentTypeValue); resetFiles(); }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select the document you're scanning" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>File format</FieldLabel>
        <div className="flex w-fit rounded-md border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => { setFormat("image"); resetFiles(); }}
            className={`rounded px-3 py-1.5 ${format === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            JPEG / PNG
          </button>
          <button
            type="button"
            onClick={() => { setFormat("pdf"); resetFiles(); }}
            className={`rounded px-3 py-1.5 ${format === "pdf" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            PDF
          </button>
        </div>
      </Field>

      {format === "pdf" ? (
        <DocumentUploadField
          value={frontFile}
          onChange={setFrontFile}
          allowCamera={false}
          accept="application/pdf"
        />
      ) : (
        <>
          <Field>
            <FieldLabel>Front {needsBack ? "" : "(and back, if double-sided)"}</FieldLabel>
            <DocumentUploadField value={frontFile} onChange={setFrontFile} allowCamera accept="image/*" />
          </Field>
          {needsBack && (
            <Field>
              <FieldLabel>Back</FieldLabel>
              <DocumentUploadField value={backFile} onChange={setBackFile} allowCamera accept="image/*" />
            </Field>
          )}
        </>
      )}

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleScan} disabled={!canScan || isPending} className="w-full">
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning document...</>
          ) : (
            <>Scan &amp; Autofill <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} disabled={isPending} className="w-full text-muted-foreground">
          Skip and enter manually
        </Button>
      </div>
    </Card>
  );
}