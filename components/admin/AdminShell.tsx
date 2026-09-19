"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, PlusCircle, FileText, Eye, Tag, ShoppingCart,
  Users, FolderOpen, Star, ClipboardList, Ticket, Home, BarChart3, Settings, Archive, Menu, X
} from "lucide-react";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-4 px-3 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-8">
      <aside className="h-fit w-full min-w-0 rounded-2xl bg-[#17130f] p-4 text-white lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3 px-3 lg:mb-4">
          <span className="font-serif text-xl font-bold">ArtCanvas Admin</span>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="admin-nav"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            {open ? <X size={14} /> : <Menu size={14} />} {open ? "Close menu" : "Menu"}
          </button>
        </div>
        <nav
          id="admin-nav"
          className={`${open ? "mt-4 grid" : "hidden"} max-h-[65vh] gap-3 overflow-y-auto overscroll-contain lg:mt-0 lg:grid lg:max-h-none lg:gap-4 lg:overflow-visible`}
          aria-label="Admin navigation"
        >
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
                      onClick={() => setOpen(false)}
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

