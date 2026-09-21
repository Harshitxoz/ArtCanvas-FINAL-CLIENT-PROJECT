import Link from "next/link";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "My Account | ArtCanvas",
  description: "Manage your ArtCanvas account, order history, and preferences.",
};

export default async function AccountPage() {
  const user = await getSession();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
      <h1 className="font-serif text-3xl font-bold sm:text-4xl">My Account</h1>

      {user ? (
        <div className="mt-6 rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-black/8 pb-5">
            <h2 className="text-xl font-bold text-neutral-900">{user.name}</h2>
            <p className="mt-0.5 text-sm text-black/60">{user.email}</p>
            {user.role === "admin" && (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                Administrator
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/account/orders"
              className="rounded-full bg-[#9a5d19] px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#7f4b12]"
            >
              View My Orders →
            </Link>

            {user.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-black/5"
              >
                Open Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-black/8 bg-white p-8 shadow-sm text-center max-w-md">
          <p className="text-sm text-black/60">
            Sign in to view your orders, saved addresses, and account details.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-full bg-[#9a5d19] px-7 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#7f4b12]"
          >
            Sign In to Account
          </Link>
        </div>
      )}
    </section>
  );
}
