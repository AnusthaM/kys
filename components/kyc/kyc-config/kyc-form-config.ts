import { UserRound, Users, MapPinned, ImagePlus, FileStack } from "lucide-react";
export const emptyPerson = { firstName: "", middleName: "", lastName: "" };
export const emptyAddress = {
  country: "",
  province: "",
  district: "",
  municipality: "",
  city: "",
  ward_no: "",
};

export const FAMILY_KEYS = ["father", "mother", "grandFather", "grandMother"] as const;
export const ADDRESS_KEYS = ["permanentAddress", "temporaryAddress"] as const;
export const EXTRA_FIELDS = ["gender", "martial_status", "occupation"] as const;

export const STEP_META = [
  { label: "Personal", icon: UserRound, title: "Personal Details", description: "Your legal name and basic information" },
  { label: "Family", icon: Users, title: "Family Details", description: "Parent and grandparent information" },
  { label: "Address", icon: MapPinned, title: "Address", description: "Permanent and current residence" },
  { label: "Photo & Signature", icon: ImagePlus, title: "Photo & Signature", description: "A clear photo of your face and your signature" },
  { label: "Documents", icon: FileStack, title: "Identity Documents", description: "At least one government-issued document" },
];