"use client";

import { useQuery } from "@tanstack/react-query";

import { useAtestadosStore } from "@/stores/atestados-store";

export const certificatesQueryKey = ["medical-certificates"];

export function useMedicalCertificates() {
  const certificates = useAtestadosStore((state) => state.certificates);
  const query = useQuery({
    queryKey: certificatesQueryKey,
    queryFn: async () => certificates,
  });

  return {
    ...query,
    data: certificates,
  };
}
