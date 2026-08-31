import { z } from "zod";

function isOneOf<T extends string>(values: readonly T[], value: string): boolean {
  return (values as readonly string[]).includes(value);
}

const signatureFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, "Max file size is 5MB")
  .refine((f) => ["image/jpeg", "application/pdf"].includes(f.type), "Signature must be JPEG or PDF");

const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, "Max file size is 5MB")
  .refine((f) => ["image/jpeg", "image/png"].includes(f.type), "Only JPG or PNG allowed");

const pdfFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 10 * 1024 * 1024, "Max file size is 10MB")
  .refine((f) => f.type === "application/pdf", "Only PDF allowed");

export const DOCUMENT_TYPES = [
  { value: "pan_card", label: "PAN Card", requiresBack: false },
  { value: "drivers_license", label: "Driver's License", requiresBack: true },
  { value: "birth_certificate", label: "Birth Certificate", requiresBack: false },
  { value: "citizenship", label: "Citizenship Certificate", requiresBack: true },
  { value: "passport", label: "Passport", requiresBack: false },
  { value: "national_id", label: "National ID", requiresBack: true },
] as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number]["value"];

export const DOCUMENT_FORMATS = [
  { value: "image", label: "JPEG / PNG" },
  { value: "pdf", label: "PDF" },
] as const;

export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number]["value"];

const documentEntrySchema = z
  .object({
    type: z.string().min(1, "Document type is required"),
    format: z.enum(["image", "pdf"]),
    front: z.instanceof(File).optional(),
    back: z.instanceof(File).optional(),
    file: z.instanceof(File).optional(),
  })
  .superRefine((val, ctx) => {
    const config = DOCUMENT_TYPES.find((d) => d.value === val.type);

    if (!config) {
      ctx.addIssue({ code: "custom", message: "Select a valid document type", path: ["type"] });
      return;
    }

    if (val.format === "pdf") {
      const result = pdfFileSchema.safeParse(val.file);
      if (!result.success) {
        ctx.addIssue({ code: "custom", message: result.error.issues[0]?.message ?? "PDF is required", path: ["file"] });
      }
      return;
    }

    const frontResult = imageFileSchema.safeParse(val.front);
    if (!frontResult.success) {
      ctx.addIssue({ code: "custom", message: frontResult.error.issues[0]?.message ?? "Front image is required", path: ["front"] });
    }
    if (config.requiresBack) {
      const backResult = imageFileSchema.safeParse(val.back);
      if (!backResult.success) {
        ctx.addIssue({ code: "custom", message: backResult.error.issues[0]?.message ?? "Back image is required", path: ["back"] });
      }
    }
  });

const genderValues = ["male", "female", "rather-not-say"] as const;
const maritalValues = ["married", "single", "divorced", "widowed", "rather-not-say"] as const;
const occupationValues = ["employed", "unemployed", "student", "self-employed"] as const;
const municipalityValues = ["metropolitan", "sub-metropolitan", "municipality", "rural-municipality"] as const;

const addressSchema = z.object({
  country: z.string().min(1, "Country is required"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  municipality: z.string().refine((v) => isOneOf(municipalityValues, v), "Select a municipality type"),
  city: z.string().min(1, "City is required"),
  ward_no: z.string().min(1, "Ward number is required"),
});

const requiredPersonSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
});

const optionalPersonSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
});

export const kycSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  father: requiredPersonSchema,
  mother: requiredPersonSchema,
  grandFather: optionalPersonSchema,
  grandMother: optionalPersonSchema,
  dob: z.string().min(1, "Date of birth is required"),
  email: z.email("Enter a valid email address").optional(),
  phone: z.string().min(7, "Enter a valid phone number"),
  nationality: z.string().min(1, "Nationality is required"),
  gender: z.string().refine((v) => isOneOf(genderValues, v), "Select a gender"),
  martial_status: z.string().refine((v) => isOneOf(maritalValues, v), "Select a marital status"),
  occupation: z.string().refine((v) => isOneOf(occupationValues, v), "Select an occupation"),
  permanentAddress: addressSchema,
  temporaryAddress: addressSchema,
  photo: z.instanceof(File, { message: "Photo is required" }),
   signature: signatureFileSchema,
  documents: z.array(documentEntrySchema).min(1, "Add at least one document"),
});

export type KycFormValues = z.infer<typeof kycSchema>;

export const PERSONAL_FIELDS: { name: "firstName" | "middleName" | "lastName" | "dob" | "email" | "phone" | "nationality"; label: string; type?: string }[] = [
  { name: "firstName", label: "First Name" },
  { name: "middleName", label: "Middle Name" },
  { name: "lastName", label: "Last Name" },
  { name: "dob", label: "Date of Birth", type: "date" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone Number", type: "tel" },
  { name: "nationality", label: "Nationality" },
];

export const FAMILY_GROUPS: { key: "father" | "mother" | "grandFather" | "grandMother"; label: string; optional?: boolean }[] = [
  { key: "father", label: "Father's Details" },
  { key: "mother", label: "Mother's Details" },
  { key: "grandFather", label: "Grandfather's Details", optional: true },
  { key: "grandMother", label: "Grandmother's Details", optional: true },
];

export const SELECT_FIELDS: { name: "gender" | "martial_status" | "occupation"; label: string; options: { value: string; label: string }[] }[] = [
  {
    name: "gender", label: "Gender",
    options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "rather-not-say", label: "Rather not say" }],
  },
  {
    name: "martial_status", label: "Marital Status",
    options: [
      { value: "single", label: "Single" }, { value: "married", label: "Married" },
      { value: "divorced", label: "Divorced" }, { value: "widowed", label: "Widowed" },
      { value: "rather-not-say", label: "Rather not say" },
    ],
  },
  {
    name: "occupation", label: "Occupation",
    options: [
      { value: "employed", label: "Employed" }, { value: "unemployed", label: "Unemployed" },
      { value: "student", label: "Student" }, { value: "self-employed", label: "Self-employed" },
    ],
  },
];

export const ADDRESS_FIELDS: { name: "country" | "province" | "district" | "city" | "ward_no"; label: string }[] = [
  { name: "country", label: "Country" },
  { name: "province", label: "Province" },
  { name: "district", label: "District" },
  { name: "city", label: "City" },
  { name: "ward_no", label: "Ward No." },
];

export const STEP_FIELDS = [
  ["firstName", "middleName", "lastName", "dob", "email", "phone", "nationality", "gender", "martial_status", "occupation"],
  ["father", "mother", "grandFather", "grandMother"],
  ["permanentAddress", "temporaryAddress"],
  ["photo","signature"],
  ["documents"],
] as const;

export const MUNICIPALITY_OPTIONS = [
  { value: "metropolitan", label: "Metropolitan City" },
  { value: "sub-metropolitan", label: "Sub-Metropolitan City" },
  { value: "municipality", label: "Municipality" },
  { value: "rural-municipality", label: "Rural Municipality" },
];