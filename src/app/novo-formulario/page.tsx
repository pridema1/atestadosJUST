"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ClipboardPlusIcon } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
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
import { searchCidRecords } from "@/lib/cid";
import { certificatesQueryKey } from "@/hooks/use-atestados";
import { useAtestadosStore } from "@/stores/atestados-store";
import type {
  CidFields,
  MedicalCertificateType,
} from "@/types/medical-certificate";
import type { CidRecord } from "@/lib/cid-data";

import styles from "./novo-formulario.module.css";

const documentTypes: Array<{ label: string; value: MedicalCertificateType }> = [
  { label: "Atestado", value: "Atestado" },
  { label: "Declaração médica", value: "Declaracao" },
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

const DEFAULT_WORKDAY_HOURS = 8;

export default function NovoFormularioPage() {
  const addCertificate = useAtestadosStore((state) => state.addCertificate);
  const queryClient = useQueryClient();
  const [type, setType] = useState<MedicalCertificateType>("Atestado");
  const [cid, setCid] = useState<CidFields>(emptyCid);
  const [cidSearch, setCidSearch] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isCidDropdownOpen, setIsCidDropdownOpen] = useState(false);

  const isMedicalCertificate = type === "Atestado";
  const cidOptions = useMemo(() => searchCidRecords(cidSearch), [cidSearch]);
  const leaveDays = useMemo(
    () => calculateLeaveDays(leaveStart, leaveEnd),
    [leaveEnd, leaveStart]
  );
  const statementHours = useMemo(
    () => calculateHoursBetween(startTime, endTime),
    [endTime, startTime]
  );

  function handleTypeChange(value: string[]) {
    const nextType = value[0] as MedicalCertificateType | undefined;

    if (nextType) {
      setType(nextType);
    }
  }

  function handleCidSearch(value: string) {
    setCidSearch(value);
    setCid({ ...emptyCid, code: value });
    setIsCidDropdownOpen(true);
  }

  function handleCidSelect(record: CidRecord) {
    setCidSearch(`${record.code} - ${record.description}`);
    setIsCidDropdownOpen(false);
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
    const computedLeaveDays = calculateLeaveDays(leaveStart, leaveEnd);
    const computedAbsenceHours =
      type === "Atestado"
        ? computedLeaveDays * DEFAULT_WORKDAY_HOURS
        : calculateHoursBetween(startTime, endTime);
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
      leaveDays: computedLeaveDays,
      absenceHours: computedAbsenceHours,
      cidCode: cid.code,
    });

    if (missingFields.length) {
      toast.error(`Campos obrigatórios faltando: ${missingFields.join(", ")}.`);
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
      leaveDays: computedLeaveDays || undefined,
      absenceHours: computedAbsenceHours,
      hourlyValue: hourlyValue || undefined,
      cid: cid.code ? cid : undefined,
      notes: getField(formData, "notes") || undefined,
    });

    queryClient.invalidateQueries({ queryKey: certificatesQueryKey });
    event.currentTarget.reset();
    setCid(emptyCid);
    setCidSearch("");
    setLeaveStart("");
    setLeaveEnd("");
    setStartTime("");
    setEndTime("");
    setType("Atestado");
    toast.success("Formulário enviado.");
  }

  return (
    <AppShell>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Novo envio médico</CardTitle>
          <CardDescription>
            Preencha os dados do atestado ou declaração médica.
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
                  label="Função"
                  placeholder="Ex.: Pedreiro, Administrativo, Mestre de obras"
                />
                <RequiredTextField
                  id="jobSite"
                  label="Obra"
                  placeholder="Ex.: Elaine Residence by JUST"
                />
              </div>

              {isMedicalCertificate ? (
                <MedicalCertificateFields
                  leaveDays={leaveDays}
                  leaveEnd={leaveEnd}
                  leaveStart={leaveStart}
                  setLeaveEnd={setLeaveEnd}
                  setLeaveStart={setLeaveStart}
                  setStartTime={setStartTime}
                  setEndTime={setEndTime}
                  startTime={startTime}
                  endTime={endTime}
                />
              ) : (
                <MedicalStatementFields
                  absenceHours={statementHours}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  setStartTime={setStartTime}
                  startTime={startTime}
                />
              )}

              <Field>
                <FieldLabel htmlFor="notes">Descrição/observação</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder={
                    isMedicalCertificate
                      ? "Ex.: Afastamento por atestado médico"
                      : "Ex.: Comparecimento em consulta médica"
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
                    Se vazio, dashboard usa valor padrão.
                  </FieldDescription>
                </Field>
              ) : null}

              <CidFieldsSection
                cid={cid}
                cidSearch={cidSearch}
                isRequired={isMedicalCertificate}
                onCidSearch={handleCidSearch}
                onCidSelect={handleCidSelect}
                isDropdownOpen={isCidDropdownOpen}
                options={cidOptions}
              />

              <Button className={styles.submit} type="submit">
                <ClipboardPlusIcon data-icon="inline-start" />
                Enviar formulário
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function MedicalCertificateFields({
  endTime,
  leaveDays,
  leaveEnd,
  leaveStart,
  setEndTime,
  setLeaveEnd,
  setLeaveStart,
  setStartTime,
  startTime,
}: {
  endTime: string;
  leaveDays: number;
  leaveEnd: string;
  leaveStart: string;
  setEndTime: (value: string) => void;
  setLeaveEnd: (value: string) => void;
  setLeaveStart: (value: string) => void;
  setStartTime: (value: string) => void;
  startTime: string;
}) {
  return (
    <>
      <div className={styles.gridTwo}>
        <Field>
          <FieldLabel htmlFor="leaveStart">Data inicial</FieldLabel>
          <Input
            id="leaveStart"
            name="leaveStart"
            required
            type="date"
            value={leaveStart}
            onChange={(event) => setLeaveStart(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="leaveEnd">Data final</FieldLabel>
          <Input
            id="leaveEnd"
            name="leaveEnd"
            required
            type="date"
            value={leaveEnd}
            onChange={(event) => setLeaveEnd(event.target.value)}
          />
        </Field>
      </div>

      <div className={styles.gridTwo}>
        <Field>
          <FieldLabel htmlFor="startTime">Hora inicial (opcional)</FieldLabel>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="endTime">Hora final (opcional)</FieldLabel>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="leaveDays">Dias de afastamento</FieldLabel>
        <Input
          id="leaveDays"
          name="leaveDays"
          readOnly
          tabIndex={-1}
          value={leaveDays || ""}
        />
      </Field>
    </>
  );
}

function MedicalStatementFields({
  absenceHours,
  endTime,
  setEndTime,
  setStartTime,
  startTime,
}: {
  absenceHours: number;
  endTime: string;
  setEndTime: (value: string) => void;
  setStartTime: (value: string) => void;
  startTime: string;
}) {
  return (
    <>
      <div className={styles.gridTwo}>
        <Field>
          <FieldLabel htmlFor="startTime">Hora inicial</FieldLabel>
          <Input
            id="startTime"
            name="startTime"
            required
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="endTime">Hora final</FieldLabel>
          <Input
            id="endTime"
            name="endTime"
            required
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="absenceHours">Horas de afastamento</FieldLabel>
        <Input
          id="absenceHours"
          name="absenceHours"
          readOnly
          tabIndex={-1}
          value={absenceHours || ""}
        />
      </Field>
    </>
  );
}

function CidFieldsSection({
  cid,
  cidSearch,
  isRequired,
  isDropdownOpen,
  onCidSearch,
  onCidSelect,
  options,
}: {
  cid: CidFields;
  cidSearch: string;
  isDropdownOpen: boolean;
  isRequired: boolean;
  onCidSearch: (value: string) => void;
  onCidSelect: (record: CidRecord) => void;
  options: CidRecord[];
}) {
  return (
    <fieldset className={styles.cidBox}>
      <legend>CID{isRequired ? "" : " (opcional)"}</legend>

      <Field className={styles.cidSearchField}>
        <FieldLabel htmlFor="cidSearch">Busca CID</FieldLabel>
        <Input
          id="cidSearch"
          name="cidSearch"
          placeholder="Busque por código, nome ou abreviação. Ex.: M54, dorsalgia, ansiedade"
          required={isRequired}
          value={cidSearch}
          onChange={(event) => onCidSearch(event.target.value)}
        />
        {isDropdownOpen && options.length ? (
          <div className={styles.cidDropdown}>
            {options.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => onCidSelect(option)}
              >
                <strong>{option.code}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <div className={styles.gridTwo}>
        <ReadOnlyCidField label="Código" value={cid.code} />
        <ReadOnlyCidField label="Abreviação" value={cid.abbreviation} />
      </div>

      <ReadOnlyCidField label="Descrição" value={cid.description} />

      <div className={styles.gridTwo}>
        <ReadOnlyCidField label="Capítulo" value={cid.chapter} />
        <ReadOnlyCidField label="Grupo" value={cid.group} />
      </div>

      <div className={styles.gridTwo}>
        <ReadOnlyCidField label="Categoria" value={cid.category} />
        <ReadOnlyCidField label="Subcategoria" value={cid.subcategory} />
      </div>
    </fieldset>
  );
}

function calculateLeaveDays(start: string, end: string) {
  if (!start || !end) {
    return 0;
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();

  if (diff < 0) {
    return 0;
  }

  return Math.floor(diff / 86400000) + 1;
}

function calculateHoursBetween(start: string, end: string) {
  if (!start || !end) {
    return 0;
  }

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const diff = endTotal - startTotal;

  if (diff <= 0) {
    return 0;
  }

  return Number((diff / 60).toFixed(2));
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
    [!role, "função"],
  ];

  if (type === "Atestado") {
    missing.push(
      [!leaveStart, "data inicial"],
      [!leaveEnd, "data final"],
      [leaveDays <= 0, "dias de afastamento"],
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
