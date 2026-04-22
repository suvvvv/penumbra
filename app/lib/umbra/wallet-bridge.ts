import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

/**
 * Shape the Umbra SDK expects from its `signer` parameter. We don't
 * import the SDK's IUmbraSigner type directly to keep this module
 * server-rendered-safe — the SDK pulls in browser-only crypto.
 */
export interface UmbraSignerShim {
  readonly address: string; // base58
  readonly publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions?<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]>;
  signMessage(msg: Uint8Array): Promise<Uint8Array>;
}

/**
 * Bridges @solana/wallet-adapter-react's WalletContextState into the
 * minimal signer interface Umbra SDK consumes.
 *
 * Usage:
 *
 *   const { wallet, publicKey, signTransaction, signMessage } = useWallet();
 *   useEffect(() => {
 *     if (!publicKey || !signTransaction || !signMessage) return;
 *     const signer = bridgeWalletAdapter({ publicKey, signTransaction, signMessage, ... });
 *     (getUmbraService("live") as LiveUmbraService).setSigner(signer);
 *   }, [publicKey, signTransaction, signMessage]);
 */
export function bridgeWalletAdapter(
  wallet: Pick<
    WalletContextState,
    "publicKey" | "signTransaction" | "signAllTransactions" | "signMessage"
  >,
): UmbraSignerShim | null {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signMessage) {
    return null;
  }
  const publicKey = wallet.publicKey;
  const signTransaction = wallet.signTransaction;
  const signAllTransactions = wallet.signAllTransactions;
  const signMessage = wallet.signMessage;

  return {
    address: publicKey.toBase58(),
    publicKey,
    signTransaction: async (tx) => {
      // wallet-adapter's typing is looser than Umbra's — safe to cast
      // because both sides accept the same Transaction/VersionedTransaction.
      const signed = await signTransaction(tx as unknown as Transaction);
      return signed as unknown as typeof tx;
    },
    signAllTransactions: signAllTransactions
      ? async (txs) => {
          const signed = await signAllTransactions(
            txs as unknown as Transaction[],
          );
          return signed as unknown as typeof txs;
        }
      : undefined,
    signMessage,
  };
}
