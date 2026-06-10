"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBrazilDate, getCertificateSummary } from "@/lib/atestados";
import { useMedicalCertificates } from "@/hooks/use-atestados";

import styles from "./inicio.module.css";

export default function InicioPage() {
  const { data: certificates = [] } = useMedicalCertificates();
  const summary = getCertificateSummary(certificates);

  return (
    <AppShell>
      <section className={styles.hero}>
        <div>
          <h1>Gestao de Atestados Medicos</h1>
          <p>
            Controle de formularios medicos, absenteismo e custo operacional
            para obras da Construtora JUST.
          </p>
        </div>
        <Link
          className={buttonVariants({ className: styles.primaryAction })}
          href="/novo-formulario"
        >
          Preencher formulario
        </Link>
      </section>

      <section className={styles.metrics} aria-label="Resumo dos atestados">
        <MetricCard
          description="Atestados e declaracoes carregados para acompanhamento."
          label="Formularios enviados"
          value={summary.totalForms.toString()}
        />
        <MetricCard
          description="Base para taxa e custo de absenteismo."
          label="Horas de afastamento"
          value={summary.totalHours.toString()}
        />
        <MetricCard
          description="Data do registro mais recente."
          label="Ultimo envio"
          value={formatBrazilDate(summary.lastSubmittedAt)}
        />
      </section>

      <div className={styles.actions}>
        <Link className={buttonVariants()} href="/novo-formulario">
          Novo envio
        </Link>
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/dashboard"
        >
          Ver dashboard
        </Link>
      </div>
    </AppShell>
  );
}

function MetricCard({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <Card className={styles.metricCard}>
      <CardHeader>
        <CardTitle className={styles.metricValue}>{value}</CardTitle>
        <CardDescription className={styles.metricLabel}>
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}
