"use client";

import { useCallback, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  AreYouOKReactiveFactoryABI,
  CALLBACK_SENDER_ADDRESS,
  FACTORY_ADDRESS,
  REACTIVE_CONTRACT_ADDRESS,
} from "@/contracts/abi";
import { CreateSwitchForm } from "./components/CreateSwitchForm";
import { SwitchCard } from "./components/SwitchCard";
import { WalletButton } from "./components/WalletButton";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: number) => void;
}) {
  return (
    <div className="fixed right-5 top-5 z-50 space-y-3">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className="block max-w-md rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-left text-sm text-white shadow-2xl"
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
      <span className="text-slate-500">{label}</span> {value}
    </div>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"my" | "beneficiary">("my");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const { data: ownerSwitches, refetch: refetchOwnerSwitches } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: AreYouOKReactiveFactoryABI,
    functionName: "getOwnerSwitches",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000",
    },
  });

  const { data: beneficiarySwitches, refetch: refetchBeneficiarySwitches } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: AreYouOKReactiveFactoryABI,
    functionName: "getBeneficiarySwitches",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000",
    },
  });

  const handleSwitchCreated = useCallback(() => {
    refetchOwnerSwitches();
    refetchBeneficiarySwitches();
  }, [refetchBeneficiarySwitches, refetchOwnerSwitches]);

  const mySwitches = ownerSwitches ?? [];
  const inheritedSwitches = beneficiarySwitches ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#133a39_0%,#07111b_40%,#02050c_100%)] px-4 pb-14 pt-8 text-white">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Reactive Hackathon Edition</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">Are You OK?</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                A dead-man&apos;s-switch rebuilt as a real Reactive dApp. The owner checks in on the origin
                controller, the Reactive contract listens for events, and the destination vault receives automated
                callbacks.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4">
              <WalletButton />
              <div className="flex flex-wrap gap-2">
                <StatusPill label="Factory" value={FACTORY_ADDRESS.slice(0, 8)} />
                <StatusPill label="Reactive" value={REACTIVE_CONTRACT_ADDRESS.slice(0, 8)} />
                <StatusPill label="Callback" value={CALLBACK_SENDER_ADDRESS.slice(0, 8)} />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">1. Origin</p>
              <p className="mt-3 text-sm leading-6 text-slate-100">Controller emits `HeartbeatRecorded` and `MissedHeartbeatReported` events.</p>
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">2. Reactive</p>
              <p className="mt-3 text-sm leading-6 text-slate-100">`react()` reads origin logs and emits callback payloads instead of relying on a bot relay.</p>
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">3. Destination</p>
              <p className="mt-3 text-sm leading-6 text-slate-100">Vault escrows ETH and only the authorized reactive sender can sync heartbeat or release inheritance.</p>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-300">
            Connect your wallet to view the vaults you created, the vaults where you are the beneficiary, and the full
            Reactive workflow.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <CreateSwitchForm onToast={addToast} onSwitchCreated={handleSwitchCreated} />

            <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setActiveTab("my")}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition ${
                  activeTab === "my" ? "bg-white text-slate-950" : "text-slate-300"
                }`}
              >
                My Vaults ({mySwitches.length})
              </button>
              <button
                onClick={() => setActiveTab("beneficiary")}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition ${
                  activeTab === "beneficiary" ? "bg-white text-slate-950" : "text-slate-300"
                }`}
              >
                Beneficiary View ({inheritedSwitches.length})
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {(activeTab === "my" ? mySwitches : inheritedSwitches).map((switchAddress) => (
                <SwitchCard
                  key={switchAddress}
                  switchAddress={switchAddress}
                  userAddress={address!}
                  role={activeTab === "my" ? "owner" : "beneficiary"}
                  onToast={addToast}
                />
              ))}
            </div>

            {(activeTab === "my" ? mySwitches : inheritedSwitches).length === 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
                No switch pairs yet. Create one first, then fill in the deployed addresses and tx hashes in the docs
                templates.
              </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-300">
              <p className="text-base font-semibold text-white">Submission checklist in this repo</p>
              <p className="mt-3">1. `contracts/reactive/` contains the Origin, Reactive, and Destination contracts.</p>
              <p>2. `script/deploy-reactive-are-you-ok.ps1` is the deployment starting point.</p>
              <p>3. `docs/DEPLOYED_ADDRESSES.template.md` is for publishing deployed addresses.</p>
              <p>4. `docs/WORKFLOW_AND_TX_HASHES.template.md` is for recording the full workflow and transaction hashes.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
