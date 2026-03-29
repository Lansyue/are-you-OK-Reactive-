"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortAddress(address?: string) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = connectors[0];

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-full border border-white/10 bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:opacity-90"
      >
        {shortAddress(address)} · Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={!injectedConnector || isPending}
      className="rounded-full border border-white/10 bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
