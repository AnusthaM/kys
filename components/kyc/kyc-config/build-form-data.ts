import { KycFormValues, PERSONAL_FIELDS } from "@/lib/kyc-schema";
import { FAMILY_KEYS, ADDRESS_KEYS, EXTRA_FIELDS } from "./kyc-form-config";

/**
 * Serializes validated KYC form values into a FormData payload ready to send
 * to the backend. Pulled out of the submit handler so that function only has
 * to orchestrate (call this, call the action, handle the result) rather than
 * also carrying all the field-by-field serialization detail inline.
 */
export function buildKycFormData(values: KycFormValues): FormData {
  const formData = new FormData();

  PERSONAL_FIELDS.forEach(({ name }) => formData.append(name, values[name] ?? ""));
  EXTRA_FIELDS.forEach((name) => formData.append(name, values[name]));

  FAMILY_KEYS.forEach((key) => {
    const person = values[key];
    (["firstName", "middleName", "lastName"] as const).forEach((field) =>
      formData.append(`${key}.${field}`, person?.[field] ?? ""),
    );
  });

  ADDRESS_KEYS.forEach((section) =>
    Object.entries(values[section]).forEach(([key, val]) =>
      formData.append(`${section}.${key}`, val as string),
    ),
  );

  formData.append("photo", values.photo);
  formData.append("signature", values.signature);

  values.documents.forEach((doc, i) => {
    formData.append(`documents[${i}].type`, doc.type);
    formData.append(`documents[${i}].format`, doc.format);

    if (doc.format === "pdf" && doc.file) {
      formData.append(`documents[${i}].file`, doc.file);
    } else {
      if (doc.front) formData.append(`documents[${i}].front`, doc.front);
      if (doc.back) formData.append(`documents[${i}].back`, doc.back);
    }

    const optionalDocFields = [
      "idNumber", "issueDate", "expiryDate",
      "informantFirstName", "informantMiddleName", "informantLastName", "informantRelationship",
    ] as const;

    optionalDocFields.forEach((field) => {
      const value = doc[field];
      if (value) formData.append(`documents[${i}].${field}`, value);
    });
  });

  return formData;
}