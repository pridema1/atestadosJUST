"use client";

import { DownloadIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatBrazilDate } from "@/lib/atestados";
import { certificatesQueryKey, useMedicalCertificates } from "@/hooks/use-atestados";
import { useAtestadosStore } from "@/stores/atestados-store";
import type { MedicalCertificate } from "@/types/medical-certificate";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import styles from "./dashboard.module.css";

type ChartMode = "bar" | "pie";

type GroupedMetric = {
  label: string;
  hours: number;
  cost: number;
};

const chartColors = ["#d9a913", "#86a8ff", "#6fd0b8", "#e07a7a", "#b991ff"];

const chartConfig = {
  hours: {
    label: "Horas",
    color: "#d9a913",
  },
  cost: {
    label: "Custo",
    color: "#86a8ff",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { data: certificates = [] } = useMedicalCertificates();
  const deleteCertificate = useAtestadosStore((state) => state.deleteCertificate);
  const updateCertificate = useAtestadosStore((state) => state.updateCertificate);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [nameFilter, setNameFilter] = useState("Todos");
  const [jobSiteFilter, setJobSiteFilter] = useState("Todos");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [cidFilter, setCidFilter] = useState("Todos");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [workdayHours, setWorkdayHours] = useState(8);
  const [businessDays, setBusinessDays] = useState(22);
  const [defaultHourlyValue, setDefaultHourlyValue] = useState(22);
  const [chartMode, setChartMode] = useState<ChartMode>("bar");
  const [editingCertificate, setEditingCertificate] =
    useState<MedicalCertificate | null>(null);

  const filteredCertificates = useMemo(
    () =>
      filterCertificates(certificates, {
        search,
        nameFilter,
        jobSiteFilter,
        roleFilter,
        cidFilter,
        startDateFilter,
        endDateFilter,
      }),
    [
      certificates,
      cidFilter,
      endDateFilter,
      jobSiteFilter,
      nameFilter,
      roleFilter,
      search,
      startDateFilter,
    ]
  );

  const summary = useMemo(
    () =>
      getDashboardSummary(
        filteredCertificates,
        workdayHours,
        businessDays,
        defaultHourlyValue
      ),
    [businessDays, defaultHourlyValue, filteredCertificates, workdayHours]
  );

  const options = useMemo(
    () => ({
      names: getUniqueOptions(certificates, (item) => item.employeeName),
      jobSites: getUniqueOptions(certificates, (item) => item.jobSite),
      roles: getUniqueOptions(certificates, (item) => item.role),
      cids: getUniqueOptions(certificates, (item) => getCidLabel(item)),
    }),
    [certificates]
  );

  const metrics = useMemo(
    () => ({
      byName: groupByMetric(
        filteredCertificates,
        (item) => item.employeeName,
        defaultHourlyValue
      ),
      byJobSite: groupByMetric(
        filteredCertificates,
        (item) => item.jobSite,
        defaultHourlyValue
      ),
      byRole: groupByMetric(
        filteredCertificates,
        (item) => item.role,
        defaultHourlyValue
      ),
      byCid: groupByMetric(
        filteredCertificates,
        (item) => getCidLabel(item),
        defaultHourlyValue
      ),
    }),
    [defaultHourlyValue, filteredCertificates]
  );

  function resetFilters() {
    setSearch("");
    setNameFilter("Todos");
    setJobSiteFilter("Todos");
    setRoleFilter("Todos");
    setCidFilter("Todos");
    setStartDateFilter("");
    setEndDateFilter("");
  }

  function downloadCsv() {
    const csv = toCsv(filteredCertificates, defaultHourlyValue);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "atestados-dashboard.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete(certificate: MedicalCertificate) {
    const confirmed = window.confirm(
      `Excluir registro de ${certificate.employeeName}?`
    );

    if (!confirmed) {
      return;
    }

    deleteCertificate(certificate.id);
    queryClient.invalidateQueries({ queryKey: certificatesQueryKey });
    toast.success("Registro excluido.");
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCertificate) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const employeeName = getFormValue(formData, "employeeName");
    const jobSite = getFormValue(formData, "jobSite");
    const role = getFormValue(formData, "role");
    const leaveStart = getFormValue(formData, "leaveStart");
    const leaveEnd = getFormValue(formData, "leaveEnd");
    const absenceHours = Number(formData.get("absenceHours") ?? 0);

    if (!employeeName || !jobSite || !role || !leaveStart || absenceHours <= 0) {
      toast.error("Preencha nome, obra, funcao, data inicial e horas.");
      return;
    }

    updateCertificate(editingCertificate.id, {
      employeeName,
      jobSite,
      role,
      leaveStart,
      leaveEnd: leaveEnd || undefined,
      absenceHours,
      hourlyValue: Number(formData.get("hourlyValue") ?? 0) || undefined,
      cid: {
        ...editingCertificate.cid,
        code: getFormValue(formData, "cidCode") || undefined,
        description: getFormValue(formData, "cidDescription") || undefined,
      },
      notes: getFormValue(formData, "notes") || undefined,
    });

    queryClient.invalidateQueries({ queryKey: certificatesQueryKey });
    setEditingCertificate(null);
    toast.success("Registro atualizado.");
  }

  return (
    <AppShell>
      <div className={styles.dashboard}>
        <section className={styles.settings}>
          <NumberField
            label="Jornada/dia"
            value={workdayHours}
            onChange={setWorkdayHours}
          />
          <NumberField
            label="Dias uteis/mes"
            value={businessDays}
            onChange={setBusinessDays}
          />
          <NumberField
            label="Valor hora padrao (R$)"
            value={defaultHourlyValue}
            onChange={setDefaultHourlyValue}
          />
        </section>

        <section className={styles.summary}>
          <SummaryCard label="Registros" value={summary.totalForms} />
          <SummaryCard label="Horas ausentes" value={summary.totalHours} />
          <SummaryCard
            label="Absenteismo"
            value={`${summary.absenteeism.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}%`}
          />
          <SummaryCard
            label="Custo estimado"
            value={summary.estimatedCost.toLocaleString("pt-BR", {
              currency: "BRL",
              style: "currency",
            })}
          />
        </section>

        <Card className={styles.filterCard}>
          <CardContent className={styles.filterContent}>
            <Field className={styles.searchField}>
              <FieldLabel htmlFor="search">Pesquisa geral</FieldLabel>
              <Input
                id="search"
                placeholder="Filtrar por nome, obra, funcao ou CID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Field>
            <FilterSelect
              label="Nome"
              options={options.names}
              value={nameFilter}
              onChange={setNameFilter}
            />
            <FilterSelect
              label="Obra"
              options={options.jobSites}
              value={jobSiteFilter}
              onChange={setJobSiteFilter}
            />
            <FilterSelect
              label="Funcao"
              options={options.roles}
              value={roleFilter}
              onChange={setRoleFilter}
            />
            <FilterSelect
              label="CID"
              options={options.cids}
              value={cidFilter}
              onChange={setCidFilter}
            />
            <Field>
              <FieldLabel htmlFor="startDateFilter">Data inicial</FieldLabel>
              <Input
                id="startDateFilter"
                type="date"
                value={startDateFilter}
                onChange={(event) => setStartDateFilter(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="endDateFilter">Data final</FieldLabel>
              <Input
                id="endDateFilter"
                type="date"
                value={endDateFilter}
                onChange={(event) => setEndDateFilter(event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <div className={styles.toolbar}>
          <Button variant="secondary" onClick={resetFilters}>
            <RotateCcwIcon data-icon="inline-start" />
            Limpar filtros
          </Button>
          <Button onClick={downloadCsv}>
            <DownloadIcon data-icon="inline-start" />
            Baixar planilha CSV
          </Button>
        </div>

        <section className={styles.chartsHeader}>
          <div>
            <h2>Resumo em graficos</h2>
            <p>Indices de atestado por nome, obra, funcao e CID.</p>
          </div>
          <Button
            className={styles.chartModeButton}
            variant="secondary"
            onClick={() => setChartMode(chartMode === "bar" ? "pie" : "bar")}
          >
            Ver grafico {chartMode === "bar" ? "pizza" : "linha"}
          </Button>
        </section>

        <section className={styles.chartGrid}>
          <MetricChart title="Indice por nome" data={metrics.byName} mode={chartMode} />
          <MetricChart title="Indice por obra" data={metrics.byJobSite} mode={chartMode} />
          <MetricChart title="Indice por funcao" data={metrics.byRole} mode={chartMode} />
          <MetricChart title="Indice por CID" data={metrics.byCid} mode={chartMode} />
        </section>

        <Card className={styles.tableCard}>
          <CardHeader className={styles.tableHeader}>
            <div>
              <CardTitle>Formularios</CardTitle>
              <CardDescription>
                Registros filtrados e prontos para sincronizacao SharePoint.
              </CardDescription>
            </div>
            <span>{filteredCertificates.length} registro(s)</span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Funcao</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>CID</TableHead>
                  <TableHead className={styles.numeric}>Horas</TableHead>
                  <TableHead className={styles.numeric}>Custo</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell>
                      <Badge variant="secondary">{certificate.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <strong>{certificate.employeeName}</strong>
                      <span className={styles.recordId}>{certificate.id}</span>
                    </TableCell>
                    <TableCell>{certificate.jobSite}</TableCell>
                    <TableCell>{certificate.role}</TableCell>
                    <TableCell>{formatDateRange(certificate)}</TableCell>
                    <TableCell>
                      <strong>{certificate.cid?.code ?? "-"}</strong>
                      <span className={styles.cidDescription}>
                        {certificate.cid?.description ?? "Sem CID"}
                      </span>
                    </TableCell>
                    <TableCell className={styles.numeric}>
                      {certificate.absenceHours}
                    </TableCell>
                    <TableCell className={styles.numeric}>
                      {getCertificateCost(
                        certificate,
                        defaultHourlyValue
                      ).toLocaleString("pt-BR", {
                        currency: "BRL",
                        style: "currency",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className={styles.rowActions}>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => setEditingCertificate(certificate)}
                        >
                          <PencilIcon data-icon="inline-start" />
                          Editar
                        </Button>
                        <Button
                          className={styles.deleteButton}
                          size="sm"
                          type="button"
                          onClick={() => handleDelete(certificate)}
                        >
                          <Trash2Icon data-icon="inline-start" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(editingCertificate)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCertificate(null);
            }
          }}
        >
          <DialogContent className={styles.editDialog}>
            <DialogHeader>
              <DialogTitle>Editar formulario</DialogTitle>
              <DialogDescription>
                Altere dados principais do registro selecionado.
              </DialogDescription>
            </DialogHeader>

            {editingCertificate ? (
              <form
                className={styles.editForm}
                key={editingCertificate.id}
                noValidate
                onSubmit={handleEditSubmit}
              >
                <div className={styles.editGrid}>
                  <EditTextField
                    defaultValue={editingCertificate.employeeName}
                    label="Nome"
                    name="employeeName"
                  />
                  <EditTextField
                    defaultValue={editingCertificate.jobSite}
                    label="Obra"
                    name="jobSite"
                  />
                  <EditTextField
                    defaultValue={editingCertificate.role}
                    label="Funcao"
                    name="role"
                  />
                  <EditTextField
                    defaultValue={editingCertificate.leaveStart}
                    label="Data inicial"
                    name="leaveStart"
                    type="date"
                  />
                  <EditTextField
                    defaultValue={editingCertificate.leaveEnd ?? ""}
                    label="Data final"
                    name="leaveEnd"
                    type="date"
                  />
                  <EditTextField
                    defaultValue={String(editingCertificate.absenceHours)}
                    label="Horas"
                    min="1"
                    name="absenceHours"
                    type="number"
                  />
                  <EditTextField
                    defaultValue={String(editingCertificate.hourlyValue ?? "")}
                    label="Valor hora"
                    min="0"
                    name="hourlyValue"
                    step="0.01"
                    type="number"
                  />
                  <EditTextField
                    defaultValue={editingCertificate.cid?.code ?? ""}
                    label="CID"
                    name="cidCode"
                  />
                </div>

                <EditTextField
                  defaultValue={editingCertificate.cid?.description ?? ""}
                  label="Descricao CID"
                  name="cidDescription"
                />

                <Field>
                  <FieldLabel htmlFor="notes">Observacao</FieldLabel>
                  <Textarea
                    defaultValue={editingCertificate.notes ?? ""}
                    id="notes"
                    name="notes"
                  />
                </Field>

                <DialogFooter>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setEditingCertificate(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar alteracoes</Button>
                </DialogFooter>
              </form>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className={styles.summaryCard}>
      <CardHeader>
        <CardTitle>{value}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        min="0"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const items = ["Todos", ...options].map((item) => ({
    label: item,
    value: item,
  }));

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        value={value}
        onValueChange={(nextValue) => onChange(String(nextValue ?? "Todos"))}
      >
        <SelectTrigger className={styles.select}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function MetricChart({
  data,
  mode,
  title,
}: {
  data: GroupedMetric[];
  mode: ChartMode;
  title: string;
}) {
  return (
    <Card className={styles.chartCard}>
      <CardHeader className={styles.chartCardHeader}>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Horas e custo</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer
            className={styles.chartContainer}
            config={chartConfig}
          >
            {mode === "bar" ? (
              <BarChart accessibilityLayer data={data} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#2f3a43" />
                <XAxis dataKey="hours" hide type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  type="category"
                  width={110}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="#d9a913" radius={5} />
              </BarChart>
            ) : (
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data}
                  dataKey="hours"
                  innerRadius={44}
                  nameKey="label"
                  outerRadius={78}
                  strokeWidth={2}
                >
                  {data.map((item, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={item.label}
                    />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ChartContainer>
        ) : (
          <p className={styles.emptyChart}>Sem dados para filtros atuais.</p>
        )}
      </CardContent>
    </Card>
  );
}

function EditTextField({
  defaultValue,
  label,
  min,
  name,
  step,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  min?: string;
  name: string;
  step?: string;
  type?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        defaultValue={defaultValue}
        id={name}
        min={min}
        name={name}
        step={step}
        type={type}
      />
    </Field>
  );
}

function filterCertificates(
  certificates: MedicalCertificate[],
  filters: {
    cidFilter: string;
    endDateFilter: string;
    jobSiteFilter: string;
    nameFilter: string;
    roleFilter: string;
    search: string;
    startDateFilter: string;
  }
) {
  const normalizedSearch = normalize(filters.search);

  return certificates.filter((certificate) => {
    const cid = getCidLabel(certificate);
    const searchable = normalize(
      [
        certificate.employeeName,
        certificate.jobSite,
        certificate.role,
        cid,
        certificate.cid?.description,
      ].join(" ")
    );
    const matchesSearch =
      !normalizedSearch || searchable.includes(normalizedSearch);
    const matchesName =
      filters.nameFilter === "Todos" ||
      certificate.employeeName === filters.nameFilter;
    const matchesJobSite =
      filters.jobSiteFilter === "Todos" ||
      certificate.jobSite === filters.jobSiteFilter;
    const matchesRole =
      filters.roleFilter === "Todos" || certificate.role === filters.roleFilter;
    const matchesCid = filters.cidFilter === "Todos" || cid === filters.cidFilter;
    const matchesStart =
      !filters.startDateFilter ||
      certificate.leaveStart >= filters.startDateFilter;
    const matchesEnd =
      !filters.endDateFilter || certificate.leaveStart <= filters.endDateFilter;

    return (
      matchesSearch &&
      matchesName &&
      matchesJobSite &&
      matchesRole &&
      matchesCid &&
      matchesStart &&
      matchesEnd
    );
  });
}

function groupByMetric(
  certificates: MedicalCertificate[],
  getKey: (certificate: MedicalCertificate) => string,
  defaultHourlyValue: number
) {
  const grouped = new Map<string, GroupedMetric>();

  certificates.forEach((certificate) => {
    const label = getKey(certificate) || "Sem informacao";
    const current = grouped.get(label) ?? { label, hours: 0, cost: 0 };

    current.hours += certificate.absenceHours;
    current.cost += getCertificateCost(certificate, defaultHourlyValue);
    grouped.set(label, current);
  });

  return [...grouped.values()]
    .sort((first, second) => second.hours - first.hours)
    .slice(0, 8);
}

function getDashboardSummary(
  certificates: MedicalCertificate[],
  workdayHours: number,
  businessDays: number,
  defaultHourlyValue: number
) {
  const totalHours = certificates.reduce(
    (sum, certificate) => sum + certificate.absenceHours,
    0
  );
  const estimatedCost = certificates.reduce(
    (sum, certificate) =>
      sum + getCertificateCost(certificate, defaultHourlyValue),
    0
  );
  const employeeCount = new Set(
    certificates.map((certificate) => certificate.employeeName)
  ).size;
  const availableHours = Math.max(1, employeeCount * workdayHours * businessDays);

  return {
    absenteeism: (totalHours / availableHours) * 100,
    estimatedCost,
    totalForms: certificates.length,
    totalHours,
  };
}

function getCertificateCost(
  certificate: MedicalCertificate,
  defaultHourlyValue: number
) {
  return certificate.absenceHours * (certificate.hourlyValue || defaultHourlyValue);
}

function getUniqueOptions(
  certificates: MedicalCertificate[],
  getValue: (certificate: MedicalCertificate) => string
) {
  return [...new Set(certificates.map(getValue).filter(Boolean))].sort();
}

function getCidLabel(certificate: MedicalCertificate) {
  return certificate.cid?.code ?? "Sem CID";
}

function formatDateRange(certificate: MedicalCertificate) {
  if (certificate.leaveEnd) {
    return `${formatBrazilDate(certificate.leaveStart)} a ${formatBrazilDate(
      certificate.leaveEnd
    )}`;
  }

  if (certificate.startTime && certificate.endTime) {
    return `${formatBrazilDate(certificate.leaveStart)} ${certificate.startTime} - ${certificate.endTime}`;
  }

  return formatBrazilDate(certificate.leaveStart);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getFormValue(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function toCsv(certificates: MedicalCertificate[], defaultHourlyValue: number) {
  const rows = certificates.map((certificate) => [
    certificate.type,
    certificate.employeeName,
    certificate.jobSite,
    certificate.role,
    formatDateRange(certificate),
    certificate.cid?.code ?? "",
    certificate.cid?.description ?? "",
    certificate.absenceHours,
    getCertificateCost(certificate, defaultHourlyValue).toFixed(2),
  ]);

  return [
    [
      "Tipo",
      "Nome",
      "Obra",
      "Funcao",
      "Data",
      "CID",
      "Descricao CID",
      "Horas",
      "Custo",
    ],
    ...rows,
  ]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")
    )
    .join("\n");
}
