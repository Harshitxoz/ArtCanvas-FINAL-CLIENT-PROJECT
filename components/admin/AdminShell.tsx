"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, PlusCircle, FileText, Eye, Tag, ShoppingCart,
  Users, FolderOpen, Star, ClipboardList, Ticket, Home, BarChart3, Settings, Archive
} from "lucide-react";
import type { ReactNode } from "react";

const NAV: { section: string; links: { href: Route; label: string; icon: ReactNode }[] }[] = [
  {
    section: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={17} /> }]
  },
  {
    section: "Products",
    links: [
      { href: "/admin/products", label: "All Products", icon: <Package size={17} /> },
      { href: "/admin/products/new", label: "Add Artwork", icon: <PlusCircle size={17} /> },
      { href: "/admin/products/drafts", label: "Drafts", icon: <FileText size={17} /> },
      { href: "/admin/products/published", label: "Published", icon: <Eye size={17} /> },
      { href: "/admin/products/sold-out", label: "Sold Out", icon: <Tag size={17} /> },
      { href: "/admin/products/archived", label: "Archived", icon: <Archive size={17} /> }
    ]
  },
  {
    section: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders", icon: <ShoppingCart size={17} /> },
      { href: "/admin/customers", label: "Customers", icon: <Users size={17} /> },
      { href: "/admin/coupons", label: "Coupons", icon: <Ticket size={17} /> }
    ]
  },
  {
    section: "Content",
    links: [
      { href: "/admin/categories", label: "Categories", icon: <FolderOpen size={17} /> },
      { href: "/admin/reviews", label: "Reviews", icon: <Star size={17} /> },
      { href: "/admin/custom-orders", label: "Custom Orders", icon: <ClipboardList size={17} /> },
      { href: "/admin/homepage", label: "Homepage", icon: <Home size={17} /> }
    ]
  },
  {
    section: "Insights",
    links: [
      { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={17} /> },
      { href: "/admin/settings", label: "Settings", icon: <Settings size={17} /> }
    ]
  }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
      <aside className="h-fit rounded-2xl bg-[#17130f] p-4 text-white lg:sticky lg:top-6">
        <div className="mb-4 px-3 font-serif text-xl font-bold">ArtCanvas Admin</div>
        <nav className="grid gap-4" aria-label="Admin navigation">
          {NAV.map(group => (
            <div key={group.section}>
              <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{group.section}</p>
              <div className="grid gap-1">
                {group.links.map(l => {
                  const activeLink = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href + "/") && l.href !== "/admin/products/new");
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      aria-current={activeLink ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${activeLink ? "bg-[#9a5d19] font-semibold text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                    >
                      {l.icon}<span>{l.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

