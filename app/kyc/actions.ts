"use server";
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

// export async function submitKyc(
//   _prevState: KycActionState,
//   formData: FormData
// ): Promise<KycActionState> {
//   try {
//     await new Promise((r) => setTimeout(r, 1000));
//     const submissionId = randomUUID();

//     console.log(`[mock KYC backend] Received submission ${submissionId}`);
//     for (const [key, value] of formData.entries()) {
//       console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
//     }

//     return { status: "success", submissionId };
//   } catch (err) {
//     console.error("[mock KYC backend] error:", err);
//     return { status: "error", message: "Submission failed. Please try again." };
//   }
// }