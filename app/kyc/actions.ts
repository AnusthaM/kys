"use server"
import { ScannedKycData, DocumentTypeValue } from "@/lib/kyc-schema";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
export type KycActionState =
  | { status: "idle" }
  | { status: "success"; submissionId: string }
  | { status: "error"; message: string };
const STORAGE_DIR = path.join(process.cwd(), ".local-kyc-storage");

export async function submitKyc(
  _prevState: KycActionState,
  formData: FormData,
): Promise<KycActionState> {
  try {
    await new Promise((r) => setTimeout(r, 1000));

    const submissionId = randomUUID();
    const submissionDir = path.join(STORAGE_DIR, submissionId);
    await mkdir(submissionDir, { recursive: true });

    //save everyfile entry to disk, collect rest as metadata
    const metadata: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const safeName = `${key.replace(/[^\w.-]/g, "_")}__${value.name}`;
        await writeFile(path.join(submissionDir, safeName), buffer);
      } else {
        metadata[key] = value;
      }
    }

    await writeFile(
      path.join(submissionDir, "_metadata.json"),
      JSON.stringify(metadata, null, 2),
    );

    console.log(
      `[mock KYC backend] Stored submission ${submissionId} at ${submissionDir}`,
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

const MOCK_PROFILES: Record<DocumentTypeValue, ScannedKycData> = {
  pan_card: {
    firstName: "Rajesh",
    middleName: "Kumar",
    lastName: "Shrestha",
    dob: "1990-11-12",
    gender: "male",
    nationality: "Nepali",
    documentType: "pan_card",
    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Kathmandu",
      municipality: "metropolitan",
      city: "Kathmandu",
      ward_no: "4",
    },
  },
  drivers_license: {
    firstName: "Sabina",
    middleName: "",
    lastName: "Gurung",
    dob: "1996-07-21",
    gender: "female",
    nationality: "Nepali",
    documentType: "drivers_license",
    address: {
      country: "Nepal",
      province: "Gandaki",
      district: "Kaski",
      municipality: "metropolitan",
      city: "Pokhara",
      ward_no: "12",
    },
  },
  birth_certificate: {
    firstName: "Bipin",
    middleName: "Raj",
    lastName: "Karki",
    dob: "2005-01-30",
    gender: "male",
    nationality: "Nepali",
    documentType: "birth_certificate",
    address: {
      country: "Nepal",
      province: "Koshi",
      district: "Morang",
      municipality: "sub-metropolitan",
      city: "Biratnagar",
      ward_no: "6",
    },
  },
  citizenship: {
    firstName: "Anustha",
    middleName: "Laxmi",
    lastName: "Maharjan",
    dob: "2003-03-05",
    gender: "female",
    nationality: "Nepali",
    documentType: "citizenship",
    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Lalitpur",
      municipality: "metropolitan",
      city: "Lalitpur",
      ward_no: "9",
    },
  },
  passport: {
    firstName: "Dipesh",
    middleName: "",
    lastName: "Thapa",
    dob: "1988-09-14",
    gender: "male",
    nationality: "Nepali",
    documentType: "passport",
    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Bhaktapur",
      municipality: "municipality",
      city: "Bhaktapur",
      ward_no: "3",
    },
  },
  national_id: {
    firstName: "Sunita",
    middleName: "Kumari",
    lastName: "Tamang",
    dob: "1999-04-18",
    gender: "female",
    nationality: "Nepali",
    documentType: "national_id",
    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Chitwan",
      municipality: "rural-municipality",
      city: "Bharatpur",
      ward_no: "15",
    },
  },
};

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
    // Swap this block out for the real fetch() call below once OCR_API_URL exists.
    await new Promise((r) => setTimeout(r, 1500));

    // ~10% chance of a simulated failure so the error path is exercisable too
    if (Math.random() < 0.1) {
      return {
        status: "error",
        message: "Could not read the document. Please try again or enter details manually.",
      };
    }

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