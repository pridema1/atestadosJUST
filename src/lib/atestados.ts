import type { MedicalCertificate } from "@/types/medical-certificate";

export const initialCertificates: MedicalCertificate[] = [];

export function formatBrazilDate(value?: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function getCertificateSummary(certificates: MedicalCertificate[]) {
  const totalHours = certificates.reduce(
    (sum, certificate) => sum + certificate.absenceHours,
    0
  );
  const lastSubmittedAt = certificates
    .map((certificate) => certificate.leaveStart)
    .sort()
    .at(-1);

  return {
    totalForms: certificates.length,
    totalHours,
    lastSubmittedAt,
  };
}
