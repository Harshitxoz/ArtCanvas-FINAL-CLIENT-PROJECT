"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success("Welcome back");
      const destination = redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
        ? redirectTarget
        : (d.user.role === "admin" ? "/admin" : "/account");
      router.push(destination as Route);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl bg-white p-7 shadow-sm">
      <label className="text-sm font-semibold">Email<Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className="text-sm font-semibold">Password<Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <Button disabled={loading}>{loading ? "Signing in…" : "Sign In"}</Button>
      <p className="text-center text-sm text-black/55">New here? <Link className="font-semibold text-[#9a5d19]" href="/register">Create an account</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-black/55">Sign in to manage your orders or store.</p>
      <Suspense fallback={<div className="mt-8 rounded-3xl bg-white p-7 shadow-sm text-center text-sm text-black/50">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
