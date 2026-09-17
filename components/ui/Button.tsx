import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex items-center justify-center rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}
