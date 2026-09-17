import type { ReactNode } from "react";
import type { Product } from "@/types";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl font-bold">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-black/70">{children}</div>
    </section>
  );
}

export function ProductDetails({ product }: { product: Product }) {
  const sizeText = (product.sizes || [])
    .map((s) => `${s.label}${s.width && s.height ? ` (${s.width} × ${s.height} in)` : ""}${s.sku ? ` · SKU ${s.sku}` : ""}`)
    .filter(Boolean);
  const specs: Array<{ label: string; value: string }> = [];
  if (nonEmpty(product.artist)) specs.push({ label: "Artist", value: product.artist });
  if (nonEmpty(product.medium)) specs.push({ label: "Medium", value: product.medium });
  if (nonEmpty(product.canvasMaterial)) specs.push({ label: "Canvas", value: product.canvasMaterial });
  if (nonEmpty(product.orientation)) specs.push({ label: "Orientation", value: product.orientation });
  if (nonEmpty(product.sku)) specs.push({ label: "SKU", value: product.sku });
  if (sizeText.length) specs.push({ label: "Available sizes", value: sizeText.join("; ") });
  if (typeof product.weight === "number" && product.weight > 0) specs.push({ label: "Weight", value: `${product.weight} kg` });
  if (product.frameAvailable) specs.push({ label: "Framing", value: "Available — choose Framed or Unframed above" });

  const sections: ReactNode[] = [];
  if (nonEmpty(product.description)) {
    sections.push(<Section key="desc" title="Description"><p>{product.description}</p></Section>);
  }
  if (specs.length) {
    sections.push(
      <Section key="specs" title="Specifications">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {specs.map((row) => (
            <div key={row.label}><dt className="font-bold text-black/80">{row.label}</dt><dd className="mt-0.5">{row.value}</dd></div>
          ))}
        </dl>
      </Section>
    );
  }
  if (nonEmpty(product.care)) {
    sections.push(<Section key="care" title="Care Instructions"><p>{product.care}</p></Section>);
  }
  if (nonEmpty(product.deliveryTime)) {
    sections.push(<Section key="delivery" title="Delivery"><p>{product.deliveryTime}</p></Section>);
  }
  if (product.artType === "hand-painted") {
    sections.push(
      <Section key="auth" title="Authenticity">
        <p>Every hand-painted ArtCanvas original is created by an artist, quality-checked before dispatch, and shipped with care. {nonEmpty(product.authenticityImage) ? "A signed authenticity image is shown in the gallery where available." : ""}</p>
      </Section>
    );
  }
  if (!sections.length) return null;
  return <div className="mt-12 grid gap-4">{sections}</div>;
}
