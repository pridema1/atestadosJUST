"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAtestadosStore } from "@/stores/atestados-store";

import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const setCurrentUser = useAtestadosStore((state) => state.setCurrentUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!username.trim() || !password.trim()) {
      toast.error("Informe usuário e senha.");
      return;
    }

    setCurrentUser(username.trim());
    toast.success("Login realizado.");
    router.push("/inicio");
  }

  const usernameInvalid = submitted && !username.trim();
  const passwordInvalid = submitted && !password.trim();

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <CardTitle>Login</CardTitle>
          <CardDescription>Acesso interno da Construtora JUST</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={usernameInvalid}>
                <FieldLabel htmlFor="username">Usuário</FieldLabel>
                <Input
                  aria-invalid={usernameInvalid}
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <FieldError>
                  {usernameInvalid ? "Informe o usuário." : null}
                </FieldError>
              </Field>

              <Field data-invalid={passwordInvalid}>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  aria-invalid={passwordInvalid}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <FieldError>
                  {passwordInvalid ? "Informe a senha." : null}
                </FieldError>
              </Field>

              <Button className={styles.submit} type="submit">
                Login
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
