"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { adminLogin, adminMe } from "@/lib/api";
import { wedding } from "@/content/wedding";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    adminMe()
      .then((ok) => {
        if (active && ok) {
          router.replace("/admin/guests");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await adminLogin(email, password);
      showToast("Đăng nhập thành công", "success");
      router.push("/admin/guests");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đăng nhập không thành công. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Quản trị thiệp cưới
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-fg">
            {wedding.groom.shortName} &amp; {wedding.bride.shortName}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-hover">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="font-sans text-lg">
                  Đăng nhập hệ thống
                </CardTitle>
                <CardDescription>
                  Đăng nhập bằng tài khoản quản trị để quản lý khách mời và lời chúc
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm text-danger-fg"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                Đăng nhập
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-medium text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            Quay về trang thiệp cưới chung
          </Link>
        </div>
      </div>
    </main>
  );
}
