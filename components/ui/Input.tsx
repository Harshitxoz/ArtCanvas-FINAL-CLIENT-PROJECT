import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"

type Props = InputHTMLAttributes<HTMLInputElement> & { id?: string }

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { id, className = "", ...props },
  ref,
) {
  return (
    <input
      id={id ?? undefined}
      ref={ref}
      className={`w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[#9a5d19] focus:ring-2 focus:ring-[#9a5d19]/10 ${className}`}
      {...props}
    />
  )
})

export { Input }
export type { Props as InputProps }

