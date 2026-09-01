/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"
import { ScannedKycData, DocumentTypeValue } from "@/lib/kyc-schema";
import { randomUUID } from "crypto";
// import path from "path";
// import { mkdir, writeFile } from "fs/promises";
import { MOCK_PROFILES } from './mock';
export type KycActionState =
  | { status: "idle" }
  | { status: "success"; submissionId: string }
  | { status: "error"; message: string };
// const STORAGE_DIR = path.join(process.cwd(), ".local-kyc-storage");

export async function submitKyc(
  _prevState: KycActionState,
  formData: FormData,
): Promise<KycActionState> {
  try {
    await new Promise((r) => setTimeout(r, 1000));

    const submissionId = randomUUID();
    // const submissionDir = path.join(STORAGE_DIR, submissionId);
    // await mkdir(submissionDir, { recursive: true });

    // save everyfile entry to disk, collect rest as metadata
    // const metadata: Record<string, string> = {};
    // for (const [key, value] of formData.entries()) {
    //   if (value instanceof File) {
    //     const buffer = Buffer.from(await value.arrayBuffer());
    //     const safeName = `${key.replace(/[^\w.-]/g, "_")}__${value.name}`;
    //     await writeFile(path.join(submissionDir, safeName), buffer);
    //   } else {
    //     metadata[key] = value;
    //   }
    // }

    // await writeFile(
    //   path.join(submissionDir, "_metadata.json"),
    //   JSON.stringify(metadata, null, 2),
    // );

    console.log(
      `[mock KYC backend] Stored submission ${submissionId}`,
    );

    return { status: "success", submissionId };
  } catch (err) {
    console.error("[mock KYC backend] error:", err);
    return { status: "error", message: "Submission failed. Please try again." };
  }
}

export type ScanActionState =
  | { status: "idle" }
  | { status: "success"; data: ScannedKycData }
  | { status: "error"; message: string };

export async function scanDocument(
  formData: FormData,
): Promise<ScanActionState> {
  try {
    const file = formData.get("document");
    if (!(file instanceof File)) {
      return { status: "error", message: "No document provided" };
    }

    const documentType = formData.get("documentType") as DocumentTypeValue | null;
    if (!documentType || !(documentType in MOCK_PROFILES)) {
      return { status: "error", message: "Select a document type before scanning" };
    }

    // Simulated OCR scan — no backend wired up yet.
    await new Promise((r) => setTimeout(r, 1500));

    return { status: "success", data: MOCK_PROFILES[documentType] };

    /* Real backend, once available:
    const proxyForm = new FormData();
    proxyForm.append("document", file);
    proxyForm.append("documentType", documentType);

    const res = await fetch(process.env.OCR_API_URL!, {
      method: "POST",
      body: proxyForm,
      headers: { Authorization: `Bearer ${process.env.OCR_API_KEY}` },
    });

    if (!res.ok) {
      return {
        status: "error",
        message: "Could not read the document. Please try again or enter details manually.",
      };
    }

    const data: ScannedKycData = await res.json();
    return { status: "success", data };
    */
  } catch (err) {
    console.error("[OCR scan] error:", err);
    return {
      status: "error",
      message: "Something went wrong while scanning. Please try again.",
    };
  }
}