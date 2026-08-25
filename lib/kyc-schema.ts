import {z} from "zod"

const fileSchema = z
    .instanceof(File)
    .refine((f) => f.size <= 5 * 1024 * 1024, "Max file size is 5MB")
    .refine((f)=> [
        "image/jpeg", "image/png", "application/pdf", "application/docx"
    ].includes(f.type), "Only JPG, PNG, PDF or DOCX allowed");

export const DOCUMENT_TYPES =[
{ value: "pan_card", label: "PAN Card", requiresBack: false },
  { value: "drivers_license", label: "Driver's License", requiresBack: true },
  { value: "birth_certificate", label: "Birth Certificate", requiresBack: false },
  { value: "citizenship", label: "Citizenship Certificate", requiresBack: true },
  { value: "passport", label: "Passport", requiresBack: false },
  { value: "national_id", label: "National ID", requiresBack: true },
] as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number]["value"];

const documentEntrySchema = z
    .object({
        type: z.enum(DOCUMENT_TYPES.map((d)=> d.value) as [DocumentTypeValue, ...DocumentTypeValue[]]),
        front : fileSchema,
        back : fileSchema.optional()
    })

export const kycSchema = z.object({
    firstName : z.string().min(2, "First Name is required"),
    middleName : z.string(),
    lastName : z.string().min(2, "Last Name is required"),
    dob: z.string().min(1, "Date of Birth is required"),
    selfie : fileSchema,
    documents : z.array(documentEntrySchema).min(1,"Add atleast one document")
})

export type KycFormValue = z.infer<typeof kycSchema>