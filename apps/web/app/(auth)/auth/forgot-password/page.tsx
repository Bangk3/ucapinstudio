"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forget-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "/auth/reset-password" }),
    });

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
        <div className="mb-3 text-4xl">📧</div>
        <h2 className="text-lg font-semibold">Cek email kamu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Link reset kata sandi sudah dikirim ke <strong>{email}</strong>
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm text-brand-600 hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold">Lupa kata sandi?</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Masukkan email akun kamu, kami akan kirim link untuk mengatur ulang kata sandi.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            placeholder="nama@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Mengirim..." : "Kirim link reset"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="text-brand-600 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
