import type { MedicalCertificate } from "@/types/medical-certificate";

export const initialCertificates: MedicalCertificate[] = [
  {
    id: "just-001",
    employeeName: "Ana Paula Santos",
    jobSite: "Obra Vila Mariana",
    role: "Pedreiro",
    type: "Atestado",
    status: "Aprovado",
    leaveStart: "2026-06-01",
    leaveEnd: "2026-06-03",
    leaveDays: 3,
    absenceHours: 72,
    cid: { code: "J11.0" },
    notes: "Documento conferido pela administracao da obra.",
  },
  {
    id: "just-002",
    employeeName: "Carlos Eduardo Lima",
    jobSite: "Obra Centro",
    role: "Tecnico de seguranca",
    type: "Declaracao",
    status: "Em analise",
    leaveStart: "2026-06-03",
    startTime: "08:00",
    endTime: "12:00",
    absenceHours: 32,
    notes: "Aguardando validacao do responsavel direto.",
  },
  {
    id: "just-003",
    employeeName: "Mariana Costa",
    jobSite: "Obra Alphaville",
    role: "Engenheira civil",
    type: "Atestado",
    status: "Enviado",
    leaveStart: "2026-06-05",
    leaveEnd: "2026-06-10",
    leaveDays: 6,
    absenceHours: 144,
    cid: { code: "M54.5" },
  },
];

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
