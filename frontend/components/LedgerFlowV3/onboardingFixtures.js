// onboardingFixtures.js — fixture data for the QE onboarding scene.

function isoDate(d) { return { $date: new Date(d).toISOString() }; }

// Plaintext KYC as captured by the application form
export const FRIDA_KYC = {
  fullName: "Frida Karlsson",
  email: "frida.k@mail.se",
  dateOfBirth: "1985-07-22",
  nationality: "SE",
  nationalId: "SE-8507-2193-K",
  taxId: "5902881933",
  passportNumber: "SE8507219K",
};

// Encrypted fields — BSON subType "06" = MongoDB Queryable Encryption (FLE2)
const qe = (b64) => ({ $binary: { base64: b64, subType: "06" } });

export const FRIDA_CUSTOMER_DOC = {
  customerId: "CUST-FRIDA-001",
  fullName: "Frida Karlsson",
  email: "frida.k@mail.se",
  dateOfBirth: isoDate("1985-07-22"),
  nationality: "SE",
  nationalId:     qe("BhPxK3m9qR4T7wZnLvDsYeXoMcAiUfNgHjWk2ClOs0Pu1Qv5R8="),
  taxId:          qe("Bh7mN2kLqT9wZpXoYeRsDcAiUfNvHjWg4ClMs0Pu3Qv8R1Bt5K="),
  passportNumber: qe("BhZnT4kLqM9wRpXoYeWsDcAiUfNvHjCg1ClOs0Pu6Qv3R8Bt2K="),
  dekId: "DEK-FRIDA-001",
  kycStatus: "VERIFIED",
  createdAt: isoDate("2026-05-06T09:00:00Z"),
};

// DEK document stored in the key vault collection (keyVault)
export const FRIDA_DEK = {
  _id: "DEK-FRIDA-001",
  customerId: "CUST-FRIDA-001",
  keyMaterial: {
    $binary: {
      base64: "3HtYqPx8mKzLvNjRw5oBdCsAeXfU9GiT2WyMnZp0QkDlVrIuJ4=",
      subType: "00",
    },
  },
  masterKeyProvider: {
    provider: "kmip",
    endpoint: "vault.leafybank.internal",
    keyId: "master-001",
  },
  createdAt: isoDate("2026-05-06T09:00:01Z"),
};
