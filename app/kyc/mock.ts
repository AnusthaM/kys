import { DocumentTypeValue, ScannedKycData } from '@/lib/kyc-schema';

export const MOCK_PROFILES: Record<DocumentTypeValue, ScannedKycData> = {
  // =========================================================
  // PAN CARD
  // =========================================================
  pan_card: {
    firstName: "Rajesh",
    middleName: "Kumar",
    lastName: "Shrestha",

    dob: "1990-11-12",
    gender: "male",
    nationality: "Nepali",
    documentType: "pan_card",

    panNo: "123456789",

    father: {
      firstName: "Krishna",
      middleName: "Bahadur",
      lastName: "Shrestha",
    },

    citizenshipNo: "12-01-90-12345",

    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Kathmandu",
      municipality: "metropolitan",
      city: "Kathmandu",
      ward_no: "4",
    },
  },

  // =========================================================
  // DRIVING LICENSE
  // =========================================================
  drivers_license: {
    firstName: "Sabina",
    middleName: "",
    lastName: "Gurung",

    dob: "1996-07-21",
    gender: "female",
    nationality: "Nepali",
    documentType: "drivers_license",

    licenseNo: "01-06-00987654",

    issueDate: "2021-08-15",
    expiryDate: "2027-08-14",

    citizenshipNo: "45-02-96-67890",

    passportNo: "PA1234567",

    contactNo: "9841234567",

    address: {
      country: "Nepal",
      province: "Gandaki",
      district: "Kaski",
      municipality: "metropolitan",
      city: "Pokhara",
      ward_no: "12",
    },
  },

  // =========================================================
  // BIRTH CERTIFICATE
  // =========================================================
  birth_certificate: {
    firstName: "Bipin",
    middleName: "Raj",
    lastName: "Karki",

    dob: "2005-01-30",
    gender: "male",
    nationality: "Nepali",
    documentType: "birth_certificate",

    birthRegistrationNo: "05-2005-001234",

    father: {
      firstName: "Ram",
      middleName: "Prasad",
      lastName: "Karki",
    },

    mother: {
      firstName: "Gita",
      middleName: "",
      lastName: "Karki",
    },

    informant: {
      firstName: "Ram",
      middleName: "Prasad",
      lastName: "Karki",
    },

    informantRelationship: "Father",

    address: {
      country: "Nepal",
      province: "Koshi",
      district: "Morang",
      municipality: "sub-metropolitan",
      city: "Biratnagar",
      ward_no: "6",
    },
  },

  // =========================================================
  // CITIZENSHIP CERTIFICATE
  // =========================================================
  citizenship: {
    firstName: "Anustha",
    middleName: "Laxmi",
    lastName: "Maharjan",

    dob: "2003-03-05",
    gender: "female",
    nationality: "Nepali",
    documentType: "citizenship",

    citizenshipNo: "35-01-80-12345",

    father: {
      firstName: "Suresh",
      middleName: "Man",
      lastName: "Maharjan",
    },

    mother: {
      firstName: "Sarita",
      middleName: "",
      lastName: "Maharjan",
    },

    grandFather: {
      firstName: "Hari",
      middleName: "Man",
      lastName: "Maharjan",
    },

    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Lalitpur",
      municipality: "metropolitan",
      city: "Lalitpur",
      ward_no: "9",
    },
  },

  // =========================================================
  // PASSPORT
  // =========================================================
  passport: {
    firstName: "Dipesh",
    middleName: "",
    lastName: "Thapa",

    dob: "1988-09-14",
    gender: "male",
    nationality: "Nepali",
    documentType: "passport",

    passportNo: "PA0987654",
    citizenshipNo: "22-03-75-54321",

    address: {
      country: "Nepal",
      province: "Bagmati",
      district: "Bhaktapur",
      municipality: "municipality",
      city: "Bhaktapur",
      ward_no: "3",
    },
  },

  // =========================================================
  // NATIONAL ID
  // =========================================================
  national_id: {
    firstName: "Sunita",
    middleName: "Kumari",
    lastName: "Tamang",

    dob: "1999-04-18",
    gender: "female",
    nationality: "Nepali",
    documentType: "national_id",

    nationalIdNo: "01-1234-5678901",

    citizenshipNo: "36-02-80-45678",

    father: {
      firstName: "Dawa",
      middleName: "",
      lastName: "Tamang",
    },

    mother: {
      firstName: "Pema",
      middleName: "",
      lastName: "Tamang",
    },

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