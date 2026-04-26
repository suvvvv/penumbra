"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Shield, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/app-store";
import { NETWORK } from "@/lib/constants";
import { cn, truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Hydrated } from "./hydrated";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/vest", label: "Vest" },
  { href: "/vest/simulator", label: "Simulator" },
  { href: "/employer", label: "Stream" },
  { href: "/contributor", label: "Contributor" },
  { href: "/accountant", label: "Audit" },
  { href: "/docs", label: "SDK" },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 h-8 rounded-md text-sm inline-flex items-center transition-colors",
              active
                ? "bg-white/10 text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const setWalletAddress = useAppStore((s) => s.setWalletAddress);

  useEffect(() => {
    setWalletAddress(publicKey?.toBase58());
  }, [publicKey, setWalletAddress]);

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="mint" dot>
          {truncateAddress(publicKey.toBase58(), 4, 4)}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setVisible(true)}
      loading={connecting}
    >
      Connect wallet
    </Button>
  );
}

function DemoModeToggle() {
  const demoMode = useAppStore((s) => s.demoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-black/30">
      <Toggle checked={demoMode} onChange={setDemoMode} />
      <span className="text-xs text-[var(--color-text-muted)]">
        {demoMode ? "Demo mode" : "Live SDK"}
      </span>
      <button
        onClick={() => {
          resetToSeed();
          toast.info("Demo state reset to Acme Labs DAO seed");
        }}
        className="ml-1 text-[var(--color-text-faint)] hover:text-[var(--color-accent)] transition-colors"
        title="Reset demo state"
        aria-label="Reset demo"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[var(--color-bg)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Penumbra"
              width={28}
              height={28}
              priority
              className="rounded-lg shadow-[0_0_20px_-4px_var(--color-accent-glow)]"
            />

            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold tracking-tight">
                Penumbra
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] font-mono">
                by umbra
              </span>
            </div>
          </Link>
          <NavLinks pathname={pathname} />
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="outline" className="hidden sm:inline-flex">
            <Shield className="h-3 w-3" />
            {NETWORK === "mainnet-beta" ? "mainnet" : "devnet"}
          </Badge>
          <Hydrated>
            <DemoModeToggle />
          </Hydrated>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
