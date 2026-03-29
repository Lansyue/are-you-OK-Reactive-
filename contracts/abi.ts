const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const HEARTBEAT_INTERVAL_SECONDS = Number(
  process.env.NEXT_PUBLIC_HEARTBEAT_INTERVAL_SECONDS ?? "259200"
);

export const ORIGIN_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ORIGIN_CHAIN_ID ?? "11155111");
export const DESTINATION_CHAIN_ID = Number(process.env.NEXT_PUBLIC_DESTINATION_CHAIN_ID ?? "11155111");

export const FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined) ?? ZERO_ADDRESS;

export const REACTIVE_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_REACTIVE_CONTRACT as `0x${string}` | undefined) ?? ZERO_ADDRESS;

export const CALLBACK_SENDER_ADDRESS =
  (process.env.NEXT_PUBLIC_CALLBACK_SENDER as `0x${string}` | undefined) ?? ZERO_ADDRESS;

export const AreYouOKReactiveFactoryABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "vault", type: "address" },
      { indexed: true, internalType: "address", name: "controller", type: "address" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "address", name: "beneficiary", type: "address" },
      { indexed: false, internalType: "uint256", name: "heartbeatInterval", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "createdAt", type: "uint256" },
    ],
    name: "SwitchPairCreated",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "beneficiary_", type: "address" }],
    name: "createSwitch",
    outputs: [
      { internalType: "address", name: "vault", type: "address" },
      { internalType: "address", name: "controller", type: "address" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "beneficiary_", type: "address" }],
    name: "getBeneficiarySwitches",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner_", type: "address" }],
    name: "getOwnerSwitches",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "vault_", type: "address" }],
    name: "getSwitchPair",
    outputs: [
      {
        components: [
          { internalType: "address", name: "vault", type: "address" },
          { internalType: "address", name: "controller", type: "address" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "beneficiary", type: "address" },
          { internalType: "uint256", name: "heartbeatInterval", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
        ],
        internalType: "struct AreYouOKReactiveFactory.SwitchPair",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const AreYouOKReactiveVaultABI = [
  {
    inputs: [],
    name: "beneficiary",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "deadline",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRemainingTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "heartbeatInterval",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isExpired",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastCheckIn",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "settled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

export const AreYouOKReactiveControllerABI = [
  {
    inputs: [],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getDeadline",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastHeartbeat",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reportMissedHeartbeat",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Legacy frontend compatibility exports.
// The existing UI still imports these names.
export const AreYouOKFactoryABI = AreYouOKReactiveFactoryABI;

export const AreYouOKABI = [
  ...AreYouOKReactiveVaultABI,
  {
    inputs: [],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const CONTRACT_ADDRESS = ZERO_ADDRESS;
