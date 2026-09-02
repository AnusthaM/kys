import { z } from "zod";

const isOneOf = <T extends string>(values: readonly T[], value: string) =>
  (values as readonly string[]).includes(value);

const isValidDate = (val: string) => !Number.isNaN(new Date(val).getTime());

const issue = (ctx: z.RefinementCtx, path: string, message: string) =>
  ctx.addIssue({ code: "custom", message, path: [path] });

function validateFile(
  ctx: z.RefinementCtx,
  schema: z.ZodType<File>,
  value: File | undefined,
  path: string,
  requiredMessage: string,
) {
  const result = schema.safeParse(value);
  if (!result.success) {
    issue(ctx, path, result.error.issues[0]?.message ?? requiredMessage);
  }
}

const signatureFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, "Max file size is 5MB")
  .refine(
    (f) => ["image/jpeg", "application/pdf"].includes(f.type),
    "Signature must be JPEG or PDF",
  );

const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, "Max file size is 5MB")
  .refine(
    (f) => ["image/jpeg", "image/png"].includes(f.type),
    "Only JPG or PNG allowed",
  );

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

/** Validates issueDate/expiryDate on a document: presence, validity, future/expiry bounds, and ordering. */
function validateDocumentDates(val: z.infer<typeof documentEntrySchema>, ctx: z.RefinementCtx) {
  if (val.type !== "drivers_license") return;

  const checkDate = (path: "issueDate" | "expiryDate", requiredMsg: string) => {
    const raw = val[path];
    if (!raw) {
      issue(ctx, path, requiredMsg);
      return null;
    }
    if (!isValidDate(raw)) {
      issue(ctx, path, `Enter a valid ${path === "issueDate" ? "issue" : "expiry"} date`);
      return null;
    }
    return new Date(raw);
  };

  const issueDate = checkDate("issueDate", "Issue date is required");
  if (issueDate && issueDate > new Date()) {
    issue(ctx, "issueDate", "Issue date can't be in the future");
  }

  const expiryDate = checkDate("expiryDate", "Expiry date is required");
  if (expiryDate && expiryDate < new Date()) {
    issue(ctx, "expiryDate", "This license has expired");
  }

  if (issueDate && expiryDate && expiryDate <= issueDate) {
    issue(ctx, "expiryDate", "Expiry date must be after issue date");
  }
}

const documentEntrySchema = z
  .object({
    type: z.string().min(1, "Document type is required"),
    format: z.enum(["image", "pdf"]),
    front: z.instanceof(File).optional(),
    back: z.instanceof(File).optional(),
    file: z.instanceof(File).optional(),
    idNumber: z.string().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    informantFirstName: z.string().optional(),
    informantMiddleName: z.string().optional(),
    informantLastName: z.string().optional(),
    informantRelationship: z.string().optional(),
    fromScan: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const config = DOCUMENT_TYPES.find((d) => d.value === val.type);
    if (!config) {
      issue(ctx, "type", "Select a valid document type");
      return;
    }

    if (val.format === "pdf") {
      validateFile(ctx, pdfFileSchema, val.file, "file", "PDF is required");
    } else {
      validateFile(ctx, imageFileSchema, val.front, "front", "Front image is required");
      if (config.requiresBack) {
        validateFile(ctx, imageFileSchema, val.back, "back", "Back image is required");
      }
    }

    validateDocumentDates(val, ctx);
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

const dobSchema = z
  .string()
  .min(1, "Date of birth is required")
  .refine(isValidDate, "Enter a valid date")
  .refine((val) => new Date(val) <= new Date(), "Date of birth can't be in the future")
  .refine((val) => {
    const age = (Date.now() - new Date(val).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18;
  }, "You must be at least 18 years old")
  .refine((val) => new Date(val) >= new Date("1900-01-01"), "Enter a realistic date of birth");

const isValidAge = (val: string, min: number, max: number) =>
  /^\d+$/.test(val) && Number(val) >= min && Number(val) <= max;

const spouseAgeSchema = z
  .string()
  .optional()
  .refine((val) => !val || /^\d+$/.test(val), "Age must be a number")
  .refine((val) => !val || isValidAge(val, 18, 120), "Enter a valid age");

export const kycSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    father: requiredPersonSchema,
    mother: requiredPersonSchema,
    grandFather: optionalPersonSchema,
    grandMother: optionalPersonSchema,
    dob: dobSchema,
    email: z.email().min(1, "Email is required"),
    phone: z.string().min(7, "Enter a valid phone number"),
    nationality: z.string().min(1, "Nationality is required"),
    gender: z.string().refine((v) => isOneOf(genderValues, v), "Select a gender"),
    martial_status: z.string().refine((v) => isOneOf(maritalValues, v), "Select a marital status"),
    occupation: z.string().refine((v) => isOneOf(occupationValues, v), "Select an occupation"),
    spouseFirstName: z.string().optional(),
    spouseMiddleName: z.string().optional(),
    spouseLastName: z.string().optional(),
    spouseAge: spouseAgeSchema,
    permanentAddress: addressSchema,
    temporaryAddress: addressSchema,
    photo: z.instanceof(File, { message: "Photo is required" }),
    signature: signatureFileSchema,
    documents: z.array(documentEntrySchema).min(1, "Add at least one document"),
  })
  .superRefine((val, ctx) => {
    if (val.martial_status !== "married") return;

    if (!val.spouseFirstName) issue(ctx, "spouseFirstName", "Spouse first name is required");
    if (!val.spouseLastName) issue(ctx, "spouseLastName", "Spouse last name is required");

    if (!val.spouseAge) {
      issue(ctx, "spouseAge", "Spouse age is required");
    } else if (!isValidAge(val.spouseAge, 18, 120)) {
      issue(ctx, "spouseAge", "Enter a valid spouse age (18+)");
    }
  });

export type KycFormValues = z.infer<typeof kycSchema>;

export const PERSONAL_FIELDS: {
  name: "firstName" | "middleName" | "lastName" | "dob" | "email" | "phone" | "nationality";
  label: string;
  type?: string;
}[] = [
  { name: "firstName", label: "First Name" },
  { name: "middleName", label: "Middle Name" },
  { name: "lastName", label: "Last Name" },
  { name: "dob", label: "Date of Birth", type: "date" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone Number", type: "tel" },
  { name: "nationality", label: "Nationality" },
];

export const FAMILY_GROUPS: {
  key: "father" | "mother" | "grandFather" | "grandMother";
  label: string;
  optional?: boolean;
}[] = [
  { key: "father", label: "Father's Details" },
  { key: "mother", label: "Mother's Details" },
  { key: "grandFather", label: "Grandfather's Details", optional: true },
  { key: "grandMother", label: "Grandmother's Details", optional: true },
];

export const SELECT_FIELDS: {
  name: "gender" | "martial_status" | "occupation";
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    name: "gender",
    label: "Gender",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "rather-not-say", label: "Rather not say" },
    ],
  },
  {
    name: "martial_status",
    label: "Marital Status",
    options: [
      { value: "single", label: "Single" },
      { value: "married", label: "Married" },
      { value: "divorced", label: "Divorced" },
      { value: "widowed", label: "Widowed" },
      { value: "rather-not-say", label: "Rather not say" },
    ],
  },
  {
    name: "occupation",
    label: "Occupation",
    options: [
      { value: "employed", label: "Employed" },
      { value: "unemployed", label: "Unemployed" },
      { value: "student", label: "Student" },
      { value: "self-employed", label: "Self-employed" },
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
  [
    "firstName", "middleName", "lastName", "dob", "email", "phone", "nationality",
    "gender", "martial_status", "occupation",
    "spouseFirstName", "spouseMiddleName", "spouseLastName", "spouseAge",
  ],
  ["father", "mother", "grandFather", "grandMother"],
  ["permanentAddress", "temporaryAddress"],
  ["photo", "signature"],
  ["documents"],
  [],
] as const;

export const MUNICIPALITY_OPTIONS = [
  { value: "metropolitan", label: "Metropolitan City" },
  { value: "sub-metropolitan", label: "Sub-Metropolitan City" },
  { value: "municipality", label: "Municipality" },
  { value: "rural-municipality", label: "Rural Municipality" },
];

interface ScannedPerson {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export interface ScannedKycData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  documentType?: DocumentTypeValue;

  father?: Partial<ScannedPerson>;
  mother?: Partial<ScannedPerson>;
  grandFather?: Partial<ScannedPerson>;
  grandMother?: Partial<ScannedPerson>;

  panNo?: string;
  licenseNo?: string;
  passportNo?: string;
  nationalIdNo?: string;
  citizenshipNo?: string;
  birthRegistrationNo?: string;
  issueDate?: string;
  expiryDate?: string;
  contactNo?: string;

  informant?: Partial<ScannedPerson>;
  informantRelationship?: string;

  address?: Partial<{
    country: string;
    province: string;
    district: string;
    municipality: string;
    city: string;
    ward_no: string;
  }>;
}