"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ClipboardPlusIcon } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { findCidRecord } from "@/lib/cid";
import { certificatesQueryKey } from "@/hooks/use-atestados";
import { useAtestadosStore } from "@/stores/atestados-store";
import type {
  CidFields,
  MedicalCertificateType,
} from "@/types/medical-certificate";

import styles from "./novo-formulario.module.css";

const documentTypes: Array<{ label: string; value: MedicalCertificateType }> = [
  { label: "Atestado", value: "Atestado" },
  { label: "Declaracao medica", value: "Declaracao" },
];

const emptyCid: CidFields = {
  code: "",
  abbreviation: "",
  description: "",
  chapter: "",
  group: "",
  category: "",
  subcategory: "",
};

export default function NovoFormularioPage() {
  const addCertificate = useAtestadosStore((state) => state.addCertificate);
  const queryClient = useQueryClient();
  const [type, setType] = useState<MedicalCertificateType>("Atestado");
  const [cid, setCid] = useState<CidFields>(emptyCid);
  const [cidSearch, setCidSearch] = useState("");

  const isMedicalCertificate = type === "Atestado";

  function handleTypeChange(value: string[]) {
    const nextType = value[0] as MedicalCertificateType | undefined;

    if (nextType) {
      setType(nextType);
    }
  }

  function handleCidSearch(value: string) {
    setCidSearch(value);

    const record = findCidRecord(value);

    if (!record) {
      setCid({ ...emptyCid, code: value });
      return;
    }

    setCid({
      code: record.code,
      abbreviation: record.abbreviation,
      description: record.description,
      chapter: record.chapter,
      group: record.group,
      category: record.category,
      subcategory: record.subcategory,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const employeeName = getField(formData, "employeeName");
    const jobSite = getField(formData, "jobSite");
    const role = getField(formData, "role");
    const leaveStart = getField(formData, "leaveStart");
    const leaveEnd = getField(formData, "leaveEnd");
    const startTime = getField(formData, "startTime");
    const endTime = getField(formData, "endTime");
    const leaveDays = Number(formData.get("leaveDays") ?? 0);
    const absenceHours = Number(formData.get("absenceHours") ?? 0);
    const hourlyValue = Number(formData.get("hourlyValue") ?? 0);
    const missingFields = getMissingFields({
      type,
      employeeName,
      jobSite,
      role,
      leaveStart,
      leaveEnd,
      startTime,
      endTime,
      leaveDays,
      absenceHours,
      cidCode: cid.code,
    });

    if (missingFields.length) {
      toast.error(`Campos obrigatorios faltando: ${missingFields.join(", ")}.`);
      return;
    }

    addCertificate({
      employeeName,
      jobSite,
      role,
      type,
      leaveStart,
      leaveEnd: leaveEnd || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      leaveDays: leaveDays || undefined,
      absenceHours,
      hourlyValue: hourlyValue || undefined,
      cid: cid.code ? cid : undefined,
      notes: getField(formData, "notes") || undefined,
    });

    queryClient.invalidateQueries({ queryKey: certificatesQueryKey });
    event.currentTarget.reset();
    setCid(emptyCid);
    setCidSearch("");
    setType("Atestado");
    toast.success("Formulario enviado.");
  }

  return (
    <AppShell>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Novo envio medico</CardTitle>
          <CardDescription>
            Preencha os dados do atestado ou declaracao medica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit}>
            <FieldGroup>
              <ToggleGroup
                className={styles.typeToggle}
                spacing={0}
                value={[type]}
                onValueChange={handleTypeChange}
              >
                {documentTypes.map((item) => (
                  <ToggleGroupItem
                    className={styles.typeToggleItem}
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <RequiredTextField
                id="employeeName"
                label="Nome"
                placeholder="Nome completo do colaborador"
              />

              <div className={styles.gridTwo}>
                <RequiredTextField
                  id="role"
                  label="Funcao"
                  placeholder="Ex.: Pedreiro, Administrativo, Mestre de obras"
                />
                <RequiredTextField
                  id="jobSite"
                  label="Obra"
                  placeholder="Ex.: Elaine Residence by JUST"
                />
              </div>

              {isMedicalCertificate ? (
                <MedicalCertificateFields />
              ) : (
                <MedicalStatementFields />
              )}

              <Field>
                <FieldLabel htmlFor="notes">Descricao/observacao</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder={
                    isMedicalCertificate
                      ? "Ex.: Afastamento por atestado medico"
                      : "Ex.: Comparecimento em consulta medica"
                  }
                />
              </Field>

              {isMedicalCertificate ? (
                <Field>
                  <FieldLabel htmlFor="hourlyValue">
                    Valor hora para custo (opcional)
                  </FieldLabel>
                  <Input
                    id="hourlyValue"
                    min="0"
                    name="hourlyValue"
                    placeholder="Ex.: 22.60"
                    step="0.01"
                    type="number"
                  />
                  <FieldDescription>
                    Se vazio, dashboard usa valor padrao.
                  </FieldDescription>
                </Field>
              ) : null}

              <CidFieldsSection
                cid={cid}
                cidSearch={cidSearch}
                isRequired={isMedicalCertificate}
                onCidSearch={handleCidSearch}
              />

              <Button className={styles.submit} type="submit">
                <ClipboardPlusIcon data-icon="inline-start" />
                Enviar formulario
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function MedicalCertificateFields() {
  return (
    <>
      <div className={styles.gridTwo}>
        <RequiredTextField id="leaveStart" label="Data inicial" type="date" />
        <RequiredTextField id="leaveEnd" label="Data final" type="date" />
      </div>

      <div className={styles.gridTwo}>
        <OptionalTextField
          id="startTime"
          label="Hora inicial (opcional)"
          type="time"
        />
        <OptionalTextField
          id="endTime"
          label="Hora final (opcional)"
          type="time"
        />
      </div>

      <div className={styles.gridTwo}>
        <RequiredTextField
          id="leaveDays"
          label="Dias de afastamento"
          min="1"
          type="number"
        />
        <RequiredTextField
          id="absenceHours"
          label="Horas de afastamento"
          min="1"
          type="number"
        />
      </div>
    </>
  );
}

function MedicalStatementFields() {
  return (
    <>
      <div className={styles.gridTwo}>
        <RequiredTextField id="startTime" label="Hora inicial" type="time" />
        <RequiredTextField id="endTime" label="Hora final" type="time" />
      </div>

      <RequiredTextField
        id="absenceHours"
        label="Tempo de afastamento"
        min="1"
        type="number"
      />
    </>
  );
}

function CidFieldsSection({
  cid,
  cidSearch,
  isRequired,
  onCidSearch,
}: {
  cid: CidFields;
  cidSearch: string;
  isRequired: boolean;
  onCidSearch: (value: string) => void;
}) {
  return (
    <fieldset className={styles.cidBox}>
      <legend>CID{isRequired ? "" : " (opcional)"}</legend>

      <Field>
        <FieldLabel htmlFor="cidSearch">Busca CID</FieldLabel>
        <Input
          id="cidSearch"
          name="cidSearch"
          placeholder="Busque por codigo, nome ou abreviacao. Ex.: M54, dorsalgia, ansiedade"
          required={isRequired}
          value={cidSearch}
          onChange={(event) => onCidSearch(event.target.value)}
        />
      </Field>

      <div className={styles.gridTwo}>
        <ReadOnlyCidField label="Codigo" value={cid.code} />
        <ReadOnlyCidField label="Abreviacao" value={cid.abbreviation} />
      </div>

      <ReadOnlyCidField label="Descricao" value={cid.description} />

      <div className={styles.gridTwo}>
        <ReadOnlyCidField label="Capitulo" value={cid.chapter} />
        <ReadOnlyCidField label="Grupo" value={cid.group} />
      </div>

      <div className={styles.gridTwo}>
        <ReadOnlyCidField label="Categoria" value={cid.category} />
        <ReadOnlyCidField label="Subcategoria" value={cid.subcategory} />
      </div>
    </fieldset>
  );
}

function RequiredTextField({
  id,
  label,
  min,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  min?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        min={min}
        name={id}
        placeholder={placeholder}
        required
        type={type}
      />
    </Field>
  );
}

function OptionalTextField({
  id,
  label,
  type = "text",
}: {
  id: string;
  label: string;
  type?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} name={id} type={type} />
    </Field>
  );
}

function ReadOnlyCidField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        readOnly
        tabIndex={-1}
        value={value || "Preenchido automaticamente"}
      />
    </Field>
  );
}

function getField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getMissingFields({
  type,
  employeeName,
  jobSite,
  role,
  leaveStart,
  leaveEnd,
  startTime,
  endTime,
  leaveDays,
  absenceHours,
  cidCode,
}: {
  type: MedicalCertificateType;
  employeeName: string;
  jobSite: string;
  role: string;
  leaveStart: string;
  leaveEnd: string;
  startTime: string;
  endTime: string;
  leaveDays: number;
  absenceHours: number;
  cidCode?: string;
}) {
  const missing = [
    [!employeeName, "nome"],
    [!jobSite, "obra"],
    [!role, "funcao"],
  ];

  if (type === "Atestado") {
    missing.push(
      [!leaveStart, "data inicial"],
      [!leaveEnd, "data final"],
      [leaveDays <= 0, "dias de afastamento"],
      [absenceHours <= 0, "horas de afastamento"],
      [!cidCode, "CID"]
    );
  } else {
    missing.push(
      [!startTime, "hora inicial"],
      [!endTime, "hora final"],
      [absenceHours <= 0, "tempo de afastamento"]
    );
  }

  return missing
    .filter(([isMissing]) => isMissing)
    .map(([, label]) => label as string);
}
