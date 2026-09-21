"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }
      toast.success("Account created successfully!");
      router.push("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">Create Account</h1>
      <p className="mt-2 text-sm text-black/55">
        Join ArtCanvas to save your favorites, track orders, and receive new collection previews.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl bg-white p-7 shadow-sm">
        <label className="text-sm font-semibold">
          Full Name
          <Input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold">
          Email
          <Input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold">
          Password
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <Button disabled={loading} className="mt-2 w-full">
          {loading ? "Creating Account…" : "Create Account"}
        </Button>

        <p className="text-center text-sm text-black/55">
          Already registered?{" "}
          <Link className="font-semibold text-[#9a5d19] hover:underline" href="/login">
            Sign in here
          </Link>
        </p>
      </form>
    </section>
  );
}
