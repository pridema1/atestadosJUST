"use client";

import {
  DownloadIcon,
  InfoIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
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
import { findCidRecord } from "@/lib/cid";
import { certificatesQueryKey, useMedicalCertificates } from "@/hooks/use-atestados";
import { useAtestadosStore } from "@/stores/atestados-store";
import type {
  MedicalCertificate,
  MedicalCertificateType,
} from "@/types/medical-certificate";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import styles from "./dashboard.module.css";

type ChartMode = "bar" | "pie";
type ChartValueMode = "hours" | "cost";
type ChartTypeFilter = MedicalCertificateType | "Todos";

type GroupedMetric = {
  label: string;
  hours: number;
  cost: number;
};

const chartColors = [
  "#2563eb",
  "#86a8ff",
  "#6e4e80",
  "#e07a7a",
  "#b991ff",
  "#4fb8a8",
  "#f28c38",
  "#5fb3f3",
  "#c96f9f",
  "#8ccf5f",
  "#f0d35d",
  "#9aa7b2",
];

const chartConfig = {
  hours: {
    label: "Horas",
    color: "#2563eb",
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
  const [chartTypeFilter, setChartTypeFilter] =
    useState<ChartTypeFilter>("Todos");
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

  const chartCertificates = useMemo(
    () =>
      chartTypeFilter === "Todos"
        ? filteredCertificates
        : filteredCertificates.filter(
            (certificate) => certificate.type === chartTypeFilter
          ),
    [chartTypeFilter, filteredCertificates]
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
        chartCertificates,
        (item) => item.employeeName,
        defaultHourlyValue,
        workdayHours
      ),
      byJobSite: groupByMetric(
        chartCertificates,
        (item) => item.jobSite,
        defaultHourlyValue,
        workdayHours
      ),
      byRole: groupByMetric(
        chartCertificates,
        (item) => item.role,
        defaultHourlyValue,
        workdayHours
      ),
      byCid: groupByMetric(
        chartCertificates,
        (item) => getCidLabel(item),
        defaultHourlyValue,
        workdayHours
      ),
    }),
    [chartCertificates, defaultHourlyValue, workdayHours]
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
    const csv = toCsv(filteredCertificates, defaultHourlyValue, workdayHours);
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
    setEditingCertificate(null);
    queryClient.invalidateQueries({ queryKey: certificatesQueryKey });
    toast.success("Registro excluído.");
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
      toast.error("Preencha nome, obra, função, data inicial e horas.");
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
            label="Dias úteis/mês"
            value={businessDays}
            onChange={setBusinessDays}
          />
          <NumberField
            label="Valor hora padrão (R$)"
            value={defaultHourlyValue}
            onChange={setDefaultHourlyValue}
          />
        </section>

        <section className={styles.summary}>
          <SummaryCard label="Registros" value={summary.totalForms} />
          <SummaryCard label="Horas ausentes" value={summary.totalHours} />
          <SummaryCard
            info="Absenteísmo = (horas ausentes / horas disponíveis) x 100. Horas disponíveis = colaboradores filtrados x jornada/dia x dias úteis/mês."
            label="Absenteísmo"
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
                placeholder="Filtrar por nome, obra, função ou CID"
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
              label="Função"
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
            <h2>Resumo em gráficos</h2>
            <p>Índices por nome, obra, função e CID.</p>
          </div>
          <div className={styles.chartControls}>
            <div
              aria-label="Filtrar gráficos por tipo"
              className={styles.chartTypeToggle}
              role="group"
            >
              {(["Atestado", "Declaracao", "Todos"] as ChartTypeFilter[]).map(
                (item) => (
                  <Button
                    aria-pressed={chartTypeFilter === item}
                    data-active={chartTypeFilter === item}
                    key={item}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setChartTypeFilter(item)}
                  >
                    {formatCertificateType(item)}
                  </Button>
                )
              )}
            </div>
            <Button
              className={styles.chartModeButton}
              variant="secondary"
              onClick={() => setChartMode(chartMode === "bar" ? "pie" : "bar")}
            >
              Ver gráfico {chartMode === "bar" ? "pizza" : "linha"}
            </Button>
          </div>
        </section>

        <section className={styles.chartGrid}>
          <MetricChart title="Índice por nome" data={metrics.byName} mode={chartMode} />
          <MetricChart title="Índice por obra" data={metrics.byJobSite} mode={chartMode} />
          <MetricChart title="Índice por função" data={metrics.byRole} mode={chartMode} />
          <MetricChart title="Índice por CID" data={metrics.byCid} mode={chartMode} />
        </section>

        <Card className={styles.tableCard}>
          <CardHeader className={styles.tableHeader}>
            <div>
              <CardTitle>Formulários</CardTitle>
              <CardDescription>
                Registros filtrados e prontos para sincronização SharePoint.
              </CardDescription>
            </div>
            <span>{filteredCertificates.length} registro(s)</span>
          </CardHeader>
          <CardContent>
            <Table className={styles.recordsTable}>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>CID</TableHead>
                  <TableHead className={styles.numeric}>Horas</TableHead>
                  <TableHead className={styles.numeric}>Custo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatCertificateType(certificate.type)}
                      </Badge>
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
                      {getCidAbbreviation(certificate) ? (
                        <span className={styles.cidDescription}>
                          {getCidAbbreviation(certificate)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className={styles.numeric}>
                      {getCertificateAbsenceHours(certificate, workdayHours)}
                    </TableCell>
                    <TableCell className={styles.numeric}>
                      {getCertificateCost(
                        certificate,
                        defaultHourlyValue,
                        workdayHours
                      ).toLocaleString("pt-BR", {
                        currency: "BRL",
                        style: "currency",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className={styles.rowActions}>
                        <Button
                          aria-label={`Editar registro de ${certificate.employeeName}`}
                          size="icon-sm"
                          type="button"
                          onClick={() => setEditingCertificate(certificate)}
                        >
                          <PencilIcon />
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
              <DialogTitle>Editar formulário</DialogTitle>
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
                    label="Função"
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
                    defaultValue={String(
                      getCertificateAbsenceHours(
                        editingCertificate,
                        workdayHours
                      )
                    )}
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
                  label="Descrição CID"
                  name="cidDescription"
                />

                <Field>
                  <FieldLabel htmlFor="notes">Observação</FieldLabel>
                  <Textarea
                    defaultValue={editingCertificate.notes ?? ""}
                    id="notes"
                    name="notes"
                  />
                </Field>

                <DialogFooter className={styles.editFooter}>
                  <Button
                    className={styles.deleteButton}
                    type="button"
                    onClick={() => handleDelete(editingCertificate)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Excluir
                  </Button>
                  <div className={styles.editFooterActions}>
                    <Button
                      className={styles.cancelButton}
                      variant="secondary"
                      type="button"
                      onClick={() => setEditingCertificate(null)}
                    >
                      Cancelar
                    </Button>
                    <Button className={styles.saveButton} type="submit">
                      Salvar alterações
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  info,
  label,
  value,
}: {
  info?: string;
  label: string;
  value: number | string;
}) {
  return (
    <Card className={styles.summaryCard}>
      <CardHeader>
        <CardTitle>{value}</CardTitle>
        <CardDescription>{label}</CardDescription>
        {info ? (
          <span
            aria-label={info}
            className={styles.infoTooltip}
            tabIndex={0}
          >
            <InfoIcon aria-hidden="true" />
            <span className={styles.infoTooltipText} role="tooltip">
              {info}
            </span>
          </span>
        ) : null}
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
  const [valueMode, setValueMode] = useState<ChartValueMode>("hours");
  const sortedData = useMemo(
    () =>
      [...data].sort(
        (first, second) => second[valueMode] - first[valueMode]
      ),
    [data, valueMode]
  );

  return (
    <Card className={styles.chartCard}>
      <CardHeader className={styles.chartCardHeader}>
        <CardTitle>{title}</CardTitle>
        <div
          aria-label="Alternar métrica do gráfico"
          className={styles.chartMetricToggle}
          role="group"
        >
          <Button
            aria-pressed={valueMode === "hours"}
            data-active={valueMode === "hours"}
            size="xs"
            type="button"
            variant="ghost"
            onClick={() => setValueMode("hours")}
          >
            Horas
          </Button>
          <Button
            aria-pressed={valueMode === "cost"}
            data-active={valueMode === "cost"}
            size="xs"
            type="button"
            variant="ghost"
            onClick={() => setValueMode("cost")}
          >
            R$
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedData.length ? (
          mode === "bar" ? (
            <LinearMetricList data={sortedData} valueMode={valueMode} />
          ) : (
            <ChartContainer
              className={styles.chartContainer}
              config={chartConfig}
            >
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={sortedData}
                  dataKey={valueMode}
                  innerRadius={44}
                  nameKey="label"
                  outerRadius={78}
                  strokeWidth={2}
                >
                  {sortedData.map((item, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={item.label}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )
        ) : (
          <p className={styles.emptyChart}>Sem dados para filtros atuais.</p>
        )}
      </CardContent>
    </Card>
  );
}

function LinearMetricList({
  data,
  valueMode,
}: {
  data: GroupedMetric[];
  valueMode: ChartValueMode;
}) {
  const maxValue = Math.max(...data.map((item) => item[valueMode]), 1);

  return (
    <div className={styles.linearMetricList}>
      {data.map((item) => (
        <div className={styles.linearMetricRow} key={item.label}>
          <span className={styles.linearMetricLabel}>{item.label}</span>
          <div className={styles.linearMetricTrack}>
            <span
              className={styles.linearMetricBar}
              style={{ width: `${(item[valueMode] / maxValue) * 100}%` }}
            />
          </div>
          <strong>{formatMetricValue(item, valueMode)}</strong>
        </div>
      ))}
    </div>
  );
}

function formatMetricValue(item: GroupedMetric, valueMode: ChartValueMode) {
  if (valueMode === "hours") {
    return `${item.hours}h`;
  }

  return item.cost.toLocaleString("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency",
  });
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
  defaultHourlyValue: number,
  workdayHours: number
) {
  const grouped = new Map<string, GroupedMetric>();

  certificates.forEach((certificate) => {
    const label = getKey(certificate) || "Sem informação";
    const current = grouped.get(label) ?? { label, hours: 0, cost: 0 };

    current.hours += getCertificateAbsenceHours(certificate, workdayHours);
    current.cost += getCertificateCost(
      certificate,
      defaultHourlyValue,
      workdayHours
    );
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
    (sum, certificate) =>
      sum + getCertificateAbsenceHours(certificate, workdayHours),
    0
  );
  const estimatedCost = certificates.reduce(
    (sum, certificate) =>
      sum + getCertificateCost(certificate, defaultHourlyValue, workdayHours),
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
  defaultHourlyValue: number,
  workdayHours: number
) {
  return (
    getCertificateAbsenceHours(certificate, workdayHours) *
    (certificate.hourlyValue || defaultHourlyValue)
  );
}

function getCertificateAbsenceHours(
  certificate: MedicalCertificate,
  workdayHours: number
) {
  if (certificate.type === "Atestado" && certificate.leaveDays) {
    return certificate.leaveDays * workdayHours;
  }

  return certificate.absenceHours;
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

function getCidAbbreviation(certificate: MedicalCertificate) {
  const cidCode = certificate.cid?.code;

  if (!cidCode) {
    return "";
  }

  return (
    certificate.cid?.abbreviation ||
    findCidRecord(cidCode)?.abbreviation ||
    certificate.cid?.description ||
    ""
  );
}

function formatCertificateType(type: ChartTypeFilter) {
  if (type === "Declaracao") {
    return "Declaração";
  }

  return type;
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

function toCsv(
  certificates: MedicalCertificate[],
  defaultHourlyValue: number,
  workdayHours: number
) {
  const rows = certificates.map((certificate) => [
    formatCertificateType(certificate.type),
    certificate.employeeName,
    certificate.jobSite,
    certificate.role,
    formatDateRange(certificate),
    certificate.cid?.code ?? "",
    certificate.cid?.description ?? "",
    getCertificateAbsenceHours(certificate, workdayHours),
    getCertificateCost(certificate, defaultHourlyValue, workdayHours).toFixed(2),
  ]);

  return [
    [
      "Tipo",
      "Nome",
      "Obra",
      "Função",
      "Data",
      "CID",
      "Descrição CID",
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
