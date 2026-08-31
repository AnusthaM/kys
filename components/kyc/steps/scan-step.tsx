"use client"
import { ScanActionState, scanDocument } from "@/app/kyc/actions";
import { DOCUMENT_TYPES, DocumentTypeValue } from "@/lib/kyc-schema";
import { useState, useTransition } from 'react';
import { toast } from "sonner";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { DocumentUploadField } from '../documents/document-upload-field';
import { ScanLine, ArrowRight, Loader2 } from "lucide-react";
import { ScannedKycData } from '@/lib/kyc-schema';

interface ScanStepProps {
    onScanned: (data:ScannedKycData, file:File)=> void
    onSkip:()=> void
}

export default function ScanStep({onScanned, onSkip}: ScanStepProps) {
    const [file, setFile] = useState<File | undefined>();
    const [documentType, setDocumentType] = useState<DocumentTypeValue | "">("");
    const [isPending, startTransition] = useTransition();

    function handleScan(){
        if (!file || !documentType) return;
        const formData = new FormData()
        formData.append("document", file)
        formData.append("documentType", documentType)

        startTransition(async()=>{
            const result: ScanActionState = await scanDocument(formData)
            if(result.status === "success"){
                toast.success("Document scanned - review the details below")
                onScanned(result.data, file)
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
          onValueChange={(v) => setDocumentType(v as DocumentTypeValue)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select the document you're scanning" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <DocumentUploadField value={file} onChange={setFile} allowCamera accept="image/*,.pdf" />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={handleScan}
          disabled={!file || !documentType || isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning document...
            </>
          ) : (
            <>
              Scan &amp; Autofill <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} disabled={isPending} className="w-full text-muted-foreground">
          Skip and enter manually
        </Button>
      </div>
    </Card>
  );
}