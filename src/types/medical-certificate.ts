export type MedicalCertificateType = "Atestado" | "Declaracao";

export type MedicalCertificateStatus = "Enviado" | "Em analise" | "Aprovado";

export type MedicalCertificate = {
  id: string;
  employeeName: string;
  jobSite: string;
  role: string;
  type: MedicalCertificateType;
  status: MedicalCertificateStatus;
  leaveStart: string;
  leaveEnd?: string;
  startTime?: string;
  endTime?: string;
  leaveDays?: number;
  absenceHours: number;
  hourlyValue?: number;
  cid?: CidFields;
  notes?: string;
};

export type NewMedicalCertificateInput = Omit<
  MedicalCertificate,
  "id" | "status"
>;

export type CidFields = {
  code?: string;
  abbreviation?: string;
  description?: string;
  chapter?: string;
  group?: string;
  category?: string;
  subcategory?: string;
};
