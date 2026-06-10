"use client";

import { create } from "zustand";

import { initialCertificates } from "@/lib/atestados";
import type {
  MedicalCertificate,
  NewMedicalCertificateInput,
} from "@/types/medical-certificate";

type AtestadosState = {
  certificates: MedicalCertificate[];
  currentUser?: string;
  addCertificate: (input: NewMedicalCertificateInput) => MedicalCertificate;
  deleteCertificate: (id: string) => void;
  setCurrentUser: (username: string) => void;
  updateCertificate: (
    id: string,
    input: Partial<NewMedicalCertificateInput>
  ) => void;
};

export const useAtestadosStore = create<AtestadosState>((set) => ({
  certificates: initialCertificates,
  addCertificate: (input) => {
    const certificate: MedicalCertificate = {
      ...input,
      id: crypto.randomUUID(),
      status: "Enviado",
    };

    set((state) => ({
      certificates: [certificate, ...state.certificates],
    }));

    return certificate;
  },
  deleteCertificate: (id) =>
    set((state) => ({
      certificates: state.certificates.filter(
        (certificate) => certificate.id !== id
      ),
    })),
  setCurrentUser: (username) => set({ currentUser: username }),
  updateCertificate: (id, input) =>
    set((state) => ({
      certificates: state.certificates.map((certificate) =>
        certificate.id === id ? { ...certificate, ...input } : certificate
      ),
    })),
}));
