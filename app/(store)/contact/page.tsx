import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, Phone, MapPin, Clock, MessageSquareQuote } from "lucide-react";

export const metadata = {
  title: "Contact Us & Studio Inquiries | ArtCanvas",
  description: "Connect with the ArtCanvas team for custom paintings, framing options, and order support.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Studio Concierge</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">We would love to hear from you</h1>
        <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
          Have questions about an artwork, need framing guidance, or want to commission a custom canvas? Our studio curators are here to assist you.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        {/* Contact Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="font-serif text-xl font-bold text-neutral-900">Direct Contacts</h2>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f1ea] text-[#9a5d19]">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Email Support</p>
                <a href="mailto:support@artcanvas.com" className="text-sm font-medium text-neutral-900 hover:text-[#9a5d19] hover:underline">
                  support@artcanvas.com
                </a>
                <p className="text-xs text-neutral-400 mt-0.5">Average reply time within 4 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f1ea] text-[#9a5d19]">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Phone & WhatsApp</p>
                <a href="tel:+919876543210" className="text-sm font-medium text-neutral-900 hover:text-[#9a5d19] hover:underline">
                  +91 98765 43210
                </a>
                <p className="text-xs text-neutral-400 mt-0.5">Mon–Sat, 10:00 AM – 7:00 PM IST</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f1ea] text-[#9a5d19]">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Studio & Gallery</p>
                <p className="text-sm text-neutral-800 leading-relaxed">
                  ArtCanvas Studio, 402 Heritage Arts Enclave, Outer Ring Road, Bengaluru, Karnataka 560103
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f1ea] text-[#9a5d19]">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-500">Working Hours</p>
                <p className="text-sm text-neutral-800">Monday to Saturday: 10:00 AM – 7:00 PM</p>
                <p className="text-xs text-neutral-400 mt-0.5">Closed on National Holidays</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#201a16] p-6 sm:p-8 text-white">
            <div className="flex items-center gap-3 text-[#d4a373]">
              <MessageSquareQuote size={24} />
              <h3 className="font-serif text-lg font-bold">Custom Commission Service</h3>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Looking for a specific color palette, architectural proportions, or customized triptych for your interior project? Request a bespoke art consultation with our resident master painters.
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
