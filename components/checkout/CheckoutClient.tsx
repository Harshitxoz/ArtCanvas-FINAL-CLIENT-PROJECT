
"use client";
import Script from "next/script";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutClient() {
  const items = useCartStore(s => s.items);
  const clear = useCartStore(s => s.clear);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponBusy, setCouponBusy] = useState(false);
  const [form, setForm] = useState({name:"",email:"",phone:"",address:"",city:"",state:"",postalCode:""});
  const subtotal = items.reduce((s,i)=>s+i.price*i.quantity,0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = discountedSubtotal + shipping;

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/validate", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:coupon,subtotal})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coupon could not be applied");
      setCouponCode(data.code); setDiscount(Number(data.discount)||0);
      toast.success(`Coupon applied — you save ${formatINR(Number(data.discount)||0)}`);
    } catch (err) { setCouponCode(""); setDiscount(0); toast.error(err instanceof Error ? err.message : "Invalid coupon"); }
    finally { setCouponBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({items:items.map(i=>({productId:i.productId,size:i.size,quantity:i.quantity,...(i.frame==="framed"?{frame:"framed" as const}:{})})),customer:form,couponCode})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      if (!data.payment?.id) {
        toast.error("Payment gateway is not configured. Add Razorpay keys before accepting paid orders.");
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment checkout is still loading. Please try again.");
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.payment.amount,
        currency: data.payment.currency,
        name: "ArtCanvas",
        description: "Canvas artwork purchase",
        order_id: data.payment.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#9a5d19" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verify = await fetch("/api/payment/verify", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              orderId: data.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });
          if (!verify.ok) {
            toast.error("Payment verification failed. Please contact support.");
            return;
          }
          clear();
          toast.success("Payment successful. Your order is confirmed.");
          router.push(`/account/orders?order=${data.orderId}`);
        },
        modal: { ondismiss: () => setLoading(false) }
      });
      razorpay.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!items.length) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Your cart is empty</h1></div>;

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1fr_380px] lg:px-8">
      <form onSubmit={submit} className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8">
        <h1 className="text-4xl font-bold">Checkout</h1>
        <p className="mt-2 text-sm text-black/55">Your payment is processed through Razorpay after your order is validated.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Object.entries(form).map(([key,value]) =>
            <label key={key} className={key==="address"?"sm:col-span-2":""}>
              <span className="mb-1.5 block text-sm font-semibold capitalize">{key.replace(/([A-Z])/g," $1")}</span>
              <Input required value={value} onChange={e=>setForm({...form,[key]:e.target.value})}/>
            </label>
          )}
        </div>
        <Button className="mt-7 w-full" disabled={loading}>{loading?"Opening payment…":"Pay & Place Order"}</Button>
      </form>
      <aside className="h-fit rounded-3xl bg-[#f1ece5] p-6">
        <h2 className="text-2xl font-bold">Summary</h2>
        {items.map(i=><div key={`${i.productId}-${i.size}-${i.frame ?? "unframed"}`} className="mt-4 flex justify-between gap-4 text-sm"><span>{i.title} · {i.size}{i.frame === "framed" ? " · Framed" : ""} × {i.quantity}</span><b>{formatINR(i.price*i.quantity)}</b></div>)}
        <div className="my-5 border-t border-black/10"></div>
        <div className="flex gap-2"><input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"/><button type="button" onClick={applyCoupon} disabled={couponBusy} className="rounded-xl border border-[#9a5d19] px-3 py-2 text-sm font-semibold text-[#9a5d19]">{couponBusy?"Checking…":"Apply"}</button></div>
        {couponCode && <div className="mt-2 flex justify-between text-sm text-green-700"><span>Coupon {couponCode}</span><b>-{formatINR(discount)}</b></div>}
        <div className="mt-4 flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
        <div className="mt-2 flex justify-between"><span>Shipping</span><b>{shipping?formatINR(shipping):"Free"}</b></div>
        <div className="mt-4 flex justify-between text-xl"><span>Total</span><b>{formatINR(total)}</b></div>
      </aside>
    </div>
  </>;
}
