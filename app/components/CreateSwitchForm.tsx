"use client";

import { useEffect, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AreYouOKReactiveFactoryABI, FACTORY_ADDRESS, HEARTBEAT_INTERVAL_SECONDS } from "@/contracts/abi";

interface CreateSwitchFormProps {
  onToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
  onSwitchCreated: () => void;
}

function formatInterval(seconds: number) {
  const days = Math.floor(seconds / 86400);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function CreateSwitchForm({ onToast, onSwitchCreated }: CreateSwitchFormProps) {
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const { writeContract, data: createHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  useEffect(() => {
    if (!isCreateSuccess) {
      return;
    }

    onToast("Reactive switch pair created. Remember to add the real addresses and tx hashes to the docs.", "success");
    setBeneficiaryAddress("");
    setInitialDeposit("");
    setIsCreating(false);
    onSwitchCreated();
  }, [isCreateSuccess, onSwitchCreated, onToast]);

  const handleCreate = () => {
    if (FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000") {
      onToast("Set NEXT_PUBLIC_FACTORY_ADDRESS in your .env file first.", "warning");
      return;
    }

    if (!isAddress(beneficiaryAddress)) {
      onToast("Please enter a valid beneficiary address.", "error");
      return;
    }

    try {
      setIsCreating(true);
      onToast("Creating the controller and vault pair...", "info");

      writeContract({
        address: FACTORY_ADDRESS,
        abi: AreYouOKReactiveFactoryABI,
        functionName: "createSwitch",
        args: [beneficiaryAddress as `0x${string}`],
        value: initialDeposit ? parseEther(initialDeposit) : BigInt(0),
      });
    } catch {
      setIsCreating(false);
      onToast("Creation failed. Please check the network, wallet, and factory address.", "error");
    }
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur">
      <button
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-white/5"
      >
        <div>
          <p className="text-lg font-semibold text-white">Create Reactive Switch</p>
          <p className="text-sm text-slate-400">
            Origin controller emits events, Reactive contract forwards callbacks, destination vault escrows funds.
          </p>
        </div>
        <span className="text-sm text-slate-400">{isExpanded ? "Collapse" : "Expand"}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-white/10 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Origin</p>
              <p className="mt-2 text-sm text-slate-100">Owner checks in on the controller and emits the heartbeat log that Reactive Network listens to.</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Destination</p>
              <p className="mt-2 text-sm text-slate-100">Vault only accepts sync and settlement from the authorized reactive callback sender.</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Beneficiary Address</label>
            <input
              type="text"
              value={beneficiaryAddress}
              onChange={(event) => setBeneficiaryAddress(event.target.value)}
              placeholder="0x..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Initial Deposit</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="0.001"
                value={initialDeposit}
                onChange={(event) => setInitialDeposit(event.target.value)}
                placeholder="0.0"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
              />
              <span className="text-sm text-slate-400">ETH</span>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-slate-200">
            Heartbeat interval: {formatInterval(HEARTBEAT_INTERVAL_SECONDS)}. Once the deadline passes, the beneficiary
            reports a missed heartbeat on the origin chain, and the Reactive contract automatically forwards the
            callback to the destination vault.
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating || isConfirming || !beneficiaryAddress}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-6 py-4 text-base font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating || isConfirming ? "Creating..." : "Create Reactive Switch Pair"}
          </button>
        </div>
      )}
    </div>
  );
}
