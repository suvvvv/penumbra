"use client";

import { useEffect, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { NETWORK } from "@/lib/constants";
import { getUmbraService } from "@/lib/umbra";
import { LiveUmbraService } from "@/lib/umbra/real";
import { bridgeWalletAdapter } from "@/lib/umbra/wallet-bridge";
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Wires wallet-adapter into the LiveUmbraService as soon as a wallet
 * connects. Runs inside the WalletProvider tree so useWallet works.
 */
function UmbraSignerBinder() {
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signMessage) {
      return;
    }
    const signer = bridgeWalletAdapter(wallet);
    if (!signer) return;
    const live = getUmbraService("live");
    if (live instanceof LiveUmbraService) {
      live.setSigner(signer);
    }
  }, [wallet.publicKey, wallet.signTransaction, wallet.signMessage, wallet]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL)
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    return clusterApiUrl(
      NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet",
    );
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={false}>
        <WalletModalProvider>
          <UmbraSignerBinder />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
