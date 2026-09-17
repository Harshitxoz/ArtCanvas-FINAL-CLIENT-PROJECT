import Link from "next/link";
import Image from "next/image";
import categories from "@/data/categories.json";
export default function CategoriesPage(){return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="text-5xl font-bold">Categories</h1><div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{categories.map(c=><Link key={c.slug} href={`/categories/${c.slug}`} className="overflow-hidden rounded-3xl bg-white shadow-sm"><div className="relative aspect-[4/3]"><Image src={c.image} alt={c.name} fill className="object-cover"/></div><div className="p-5"><h2 className="text-2xl font-bold">{c.name}</h2><p className="mt-2 text-sm leading-6 text-black/55">{c.description}</p></div></Link>)}</div></section>}
