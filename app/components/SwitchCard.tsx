"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  AreYouOKReactiveControllerABI,
  AreYouOKReactiveFactoryABI,
  AreYouOKReactiveVaultABI,
  DESTINATION_CHAIN_ID,
  FACTORY_ADDRESS,
  ORIGIN_CHAIN_ID,
} from "@/contracts/abi";

interface SwitchCardProps {
  switchAddress: `0x${string}`;
  userAddress: `0x${string}`;
  role: "owner" | "beneficiary";
  onToast: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

function formatAddress(address?: string) {
  if (!address) {
    return "Unknown";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Countdown({ remainingSeconds }: { remainingSeconds: number }) {
  const [time, setTime] = useState(remainingSeconds);

  useEffect(() => {
    setTime(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (time <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTime((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [time]);

  if (time <= 0) {
    return (
      <div className="text-center">
        <p className="text-xl font-semibold text-rose-300">Heartbeat expired</p>
      </div>
    );
  }

  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Remaining</p>
      <p className="mt-1 text-lg font-semibold text-emerald-100">
        {days}d {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}

export function SwitchCard({ switchAddress, userAddress, role, onToast }: SwitchCardProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [heartbeatCooldown, setHeartbeatCooldown] = useState(0);
  const hasValidDepositAmount = !!depositAmount && Number(depositAmount) > 0;

  const { data: pair } = useReadContract({
    chainId: ORIGIN_CHAIN_ID,
    address: FACTORY_ADDRESS,
    abi: AreYouOKReactiveFactoryABI,
    functionName: "getSwitchPair",
    args: [switchAddress],
    query: {
      enabled: FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000",
    },
  });

  const controllerAddress = (pair?.controller ?? pair?.[1]) as `0x${string}` | undefined;
  const ownerAddress = (pair?.owner ?? pair?.[2]) as `0x${string}` | undefined;
  const beneficiaryAddress = (pair?.beneficiary ?? pair?.[3]) as `0x${string}` | undefined;

  const { data: balance, refetch: refetchBalance } = useReadContract({
    chainId: DESTINATION_CHAIN_ID,
    address: switchAddress,
    abi: AreYouOKReactiveVaultABI,
    functionName: "getBalance",
    query: {
      refetchInterval: isAutoSyncing ? 5000 : false,
    },
  });

  const { data: remainingTime, refetch: refetchRemainingTime } = useReadContract({
    chainId: DESTINATION_CHAIN_ID,
    address: switchAddress,
    abi: AreYouOKReactiveVaultABI,
    functionName: "getRemainingTime",
    query: {
      refetchInterval: isAutoSyncing ? 5000 : false,
    },
  });

  const { data: isExpired, refetch: refetchIsExpired } = useReadContract({
    chainId: DESTINATION_CHAIN_ID,
    address: switchAddress,
    abi: AreYouOKReactiveVaultABI,
    functionName: "isExpired",
    query: {
      refetchInterval: isAutoSyncing ? 5000 : false,
    },
  });

  const { data: settled, refetch: refetchSettled } = useReadContract({
    chainId: DESTINATION_CHAIN_ID,
    address: switchAddress,
    abi: AreYouOKReactiveVaultABI,
    functionName: "settled",
    query: {
      refetchInterval: isAutoSyncing ? 5000 : false,
    },
  });

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    setIsAutoSyncing(true);
    setDepositAmount("");
    refetchBalance();
    refetchRemainingTime();
    refetchIsExpired();
    refetchSettled();
    onToast("Transaction confirmed. Cross-chain callbacks may take a moment to sync.", "success");
  }, [isSuccess, onToast, refetchBalance, refetchIsExpired, refetchRemainingTime, refetchSettled]);

  useEffect(() => {
    if (!isAutoSyncing) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsAutoSyncing(false);
    }, 60_000);

    return () => window.clearTimeout(timer);
  }, [isAutoSyncing]);

  useEffect(() => {
    if (heartbeatCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setHeartbeatCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [heartbeatCooldown]);

  const isOwner = !!ownerAddress && ownerAddress.toLowerCase() === userAddress.toLowerCase();
  const isBeneficiary = !!beneficiaryAddress && beneficiaryAddress.toLowerCase() === userAddress.toLowerCase();

  const handleCheckIn = () => {
    if (!controllerAddress) {
      onToast("The controller address is not available yet.", "warning");
      return;
    }

    try {
      setHeartbeatCooldown(60);
      onToast("Sending a heartbeat to the origin controller...", "info");
      writeContract({
        address: controllerAddress,
        abi: AreYouOKReactiveControllerABI,
        functionName: "checkIn",
      });
    } catch {
      onToast("Heartbeat failed.", "error");
    }
  };

  const handleReportMissedHeartbeat = () => {
    if (!controllerAddress) {
      onToast("The controller address is not available yet.", "warning");
      return;
    }

    try {
      onToast("Reporting the missed heartbeat. The Reactive contract will trigger the destination callback automatically.", "info");
      writeContract({
        address: controllerAddress,
        abi: AreYouOKReactiveControllerABI,
        functionName: "reportMissedHeartbeat",
      });
    } catch {
      onToast("The report failed.", "error");
    }
  };

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      onToast("Please enter a valid amount.", "warning");
      return;
    }

    try {
      onToast("Depositing ETH into the vault...", "info");
      writeContract({
        address: switchAddress,
        abi: AreYouOKReactiveVaultABI,
        functionName: "deposit",
        value: parseEther(depositAmount),
      });
    } catch {
      onToast("Deposit failed.", "error");
    }
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{role === "owner" ? "Owner view" : "Beneficiary view"}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{settled ? "Settled vault" : "Reactive vault"}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {formatAddress(switchAddress)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vault balance</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">{balance ? formatEther(balance) : "0"} ETH</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <Countdown remainingSeconds={remainingTime ? Number(remainingTime) : 0} />
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
        <p>Controller: {formatAddress(controllerAddress)}</p>
        <p>Owner: {formatAddress(ownerAddress)}</p>
        <p>Beneficiary: {formatAddress(beneficiaryAddress)}</p>
        <p>Status: {settled ? "Funds released" : isExpired ? "Expired, waiting for report" : "Heartbeat valid"}</p>
      </div>

      <div className="mt-4 space-y-3">
        {isOwner && !settled && (
          <button
            onClick={handleCheckIn}
            disabled={isConfirming || heartbeatCooldown > 0}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
          >
            {isConfirming
              ? "Processing..."
              : heartbeatCooldown > 0
                ? `Send Heartbeat (${heartbeatCooldown}s)`
                : "Send Heartbeat"}
          </button>
        )}

        {isBeneficiary && !settled && (
          <button
            onClick={handleReportMissedHeartbeat}
            disabled={!isExpired || isConfirming}
            className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-orange-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
          >
            {isExpired ? "Report Missed Heartbeat" : "Waiting For Expiry"}
          </button>
        )}

        <div className="flex gap-3">
          <input
            type="number"
            min="0"
            step="0.001"
            value={depositAmount}
            onChange={(event) => setDepositAmount(event.target.value)}
            placeholder="Deposit ETH"
            className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />
          <button
            onClick={handleDeposit}
            disabled={isConfirming || !hasValidDepositAmount}
            className="rounded-2xl border border-cyan-300/40 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Deposit
          </button>
        </div>
        {!hasValidDepositAmount && (
          <p className="text-xs text-slate-500">Enter a deposit amount greater than 0 ETH to enable the button.</p>
        )}
      </div>
    </div>
  );
}
