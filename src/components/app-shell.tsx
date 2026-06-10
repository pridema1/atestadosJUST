"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./app-shell.module.css";

const navItems = [
  { href: "/inicio", label: "Tela inicial" },
  { href: "/novo-formulario", label: "Novo formulario" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Image
            alt="Construtora JUST"
            className={styles.logo}
            height={120}
            priority
            src="/just-logo.png"
            width={220}
          />
        </div>

        <nav className={styles.nav} aria-label="Navegacao principal">
          {navItems.map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className={styles.navLink}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
