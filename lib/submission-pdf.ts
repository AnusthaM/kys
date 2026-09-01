import jsPDF from "jspdf";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";

type Person = { firstName?: string; middleName?: string; lastName?: string };
const fullName = (p?: Person) => [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function generateSubmissionPdf(data: KycFormValues, submissionId?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 15;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 20;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - 15) { doc.addPage(); y = 20; }
  };
  const text = (t: string, size: number, bold: boolean, x = marginX) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(t, x, y);
  };
  const heading = (t: string) => {
    ensureSpace(12);
    text(t, 13, true);
    y += 6;
    doc.setDrawColor(200);
    doc.line(marginX, y, pageW - marginX, y);
    y += 6;
  };
  const row = (label: string, value?: string) => {
    if (!value) return;
    ensureSpace(6);
    text(`${label}:`, 10, true);
    text(String(value), 10, false, marginX + 45);
    y += 6;
  };
  const label = (t: string) => { ensureSpace(6); text(t, 10, true); y += 6; };
  const image = async (file: File | undefined, caption: string) => {
    if (!file?.type.startsWith("image/")) return;
    const [w, h] = [60, 40];
    ensureSpace(h + 10);
    text(caption, 9, false);
    y += 4;
    doc.addImage(await fileToDataUrl(file), file.type === "image/png" ? "PNG" : "JPEG", marginX, y, w, h, undefined, "FAST");
    y += h + 6;
  };

  text("KYC Submission Summary", 16, true);
  y += 8;
  if (submissionId) { text(`Reference ID: ${submissionId}`, 10, false); y += 6; }
  text(`Generated: ${new Date().toLocaleString()}`, 10, false);
  y += 10;

  heading("Personal Details");
  row("Full Name", fullName(data));
  row("Date of Birth", data.dob);
  row("Email", data.email);
  row("Phone", data.phone);
  row("Nationality", data.nationality);
  row("Gender", data.gender);
  row("Marital Status", data.martial_status);
  row("Occupation", data.occupation);
  if (data.martial_status === "married") {
    row("Spouse", [data.spouseFirstName, data.spouseLastName].filter(Boolean).join(" "));
    row("Spouse Age", data.spouseAge);
  }

  heading("Family Details");
  row("Father", fullName(data.father));
  row("Mother", fullName(data.mother));
  row("Grandfather", fullName(data.grandFather));
  row("Grandmother", fullName(data.grandMother));

  heading("Address");
  for (const [addrLabel, addr] of [["Permanent", data.permanentAddress], ["Temporary", data.temporaryAddress]] as const) {
    label(addrLabel);
    row("Country", addr?.country);
    row("Province", addr?.province);
    row("District", addr?.district);
    row("City", addr?.city);
    row("Ward No.", addr?.ward_no);
  }

  heading("Photo & Signature");
  await image(data.photo, "Photo");
  await image(data.signature, "Signature");

  heading(`Documents (${data.documents.length})`);
  for (const entry of data.documents) {
    ensureSpace(8);
    text(DOCUMENT_TYPES.find((d) => d.value === entry.type)?.label ?? entry.type, 11, true);
    y += 6;

    row("ID Number", entry.idNumber);
    row("Issue Date", entry.issueDate);
    row("Expiry Date", entry.expiryDate);
    if (entry.informantFirstName) {
      row(`Informant (${entry.informantRelationship ?? "—"})`, fullName({
        firstName: entry.informantFirstName, middleName: entry.informantMiddleName, lastName: entry.informantLastName,
      }));
    }

    if (entry.format === "pdf") {
      row("File", entry.file?.name);
    } else {
      await image(entry.front, "Front");
      await image(entry.back, "Back");
    }
    y += 4;
  }

  doc.save(`kyc-submission${submissionId ? `-${submissionId.slice(0, 8)}` : ""}.pdf`);
}