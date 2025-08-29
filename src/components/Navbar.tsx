"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { useUser, SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { Home as HomeIcon, Menu as MenuIcon, ChevronDown, Wallet, CreditCard, FolderTree, Repeat, Banknote } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  // Hide on landing page only
  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <LeftSection />
        <RightSection />
      </div>
    </nav>
  );
}

function LeftSection() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black text-white font-bold">S</span>
        <span className="text-base font-semibold tracking-tight">Salaryman</span>
      </Link>
    </div>
  );
}

function RightSection() {
  const { user } = useUser();
  return (
    <div className="flex items-center gap-6">
      <HomeLink />
      <ManageDropdown />

      <SignedIn>
        <ProfileDropdown avatarUrl={user?.imageUrl} />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-md border bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/90">Sign in</button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}

function ManageDropdown() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">Manage</span>
        <MenuIcon className="h-4 w-4 sm:hidden" />
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border bg-white shadow-lg ring-1 ring-black/5"
        >
          <MenuItem href="/accounts" label="Accounts" Icon={Wallet} active={pathname.startsWith("/accounts")} onClick={() => setOpen(false)} />
          <MenuItem href="/cards" label="Credit Cards" Icon={CreditCard} active={pathname.startsWith("/cards")} onClick={() => setOpen(false)} />
          <MenuItem href="/categories" label="Categories" Icon={FolderTree} active={pathname.startsWith("/categories")} onClick={() => setOpen(false)} />
          <MenuItem href="/recurring" label="Recurring Payments" Icon={Repeat} active={pathname.startsWith("/recurring")} onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function HomeLink() {
  const pathname = usePathname();
  const active = pathname.startsWith("/dashboard");
  return (
    <Link
      href="/dashboard"
      className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium ${
        active ? "bg-gray-900 text-white" : "text-gray-800 hover:bg-gray-100"
      }`}
    >
      <span className="hidden sm:inline">Home</span>
      <HomeIcon className="h-4 w-4 sm:hidden" />
    </Link>
  );
}

function MenuItem({ href, label, active, onClick, Icon }: { href: string; label: string; active?: boolean; onClick?: () => void; Icon?: ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 text-sm ${
        active ? "bg-gray-900 text-white" : "text-gray-800 hover:bg-gray-100"
      }`}
      role="menuitem"
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{label}</span>
    </Link>
  );
}

function ProfileDropdown({ avatarUrl }: { avatarUrl?: string }) {
  const [open, setOpen] = useState(false);
  const { openUserProfile } = useClerk();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-gray-200"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl || "https://placehold.co/64x64?text=U"}
          alt="User"
          className="h-full w-full object-cover"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border bg-white shadow-lg ring-1 ring-black/5"
        >
          <button
            className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              openUserProfile?.();
            }}
            role="menuitem"
          >
            View profile
          </button>
          <SignOutButton>
            <button
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Log out
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}
