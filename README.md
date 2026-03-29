# Are You OK? | Reactive Dead Man's Switch

`Are You OK?` is a Reactive Network dead-man's-switch dApp.

The owner checks in on an Origin controller contract. If the owner stops checking in before the deadline, the beneficiary reports the missed heartbeat on the Origin chain, and the Reactive Contract automatically triggers the Destination vault callback to release the escrowed ETH.

## Demo Video

- Watch the recorded demo: [assets/demo/are-you-ok-demo.mp4](./assets/demo/are-you-ok-demo.mp4)

## Why This Project Exists

Traditional smart contracts are passive. Even if a contract can determine that a user has missed a deadline, someone still needs to watch events and manually submit the next transaction.

This project uses Reactive Network to remove that manual relay step.

Without Reactive Network:

1. Someone must monitor the owner's heartbeat events off-chain.
2. Someone must decide when the heartbeat has expired.
3. Someone must manually trigger the payout action on the destination contract.

With Reactive Network:

1. The Origin contract emits heartbeat-related events.
2. The Reactive contract listens for those EVM events.
3. The Reactive contract automatically emits the callback instruction.
4. The Destination contract receives the callback and updates state or releases inheritance.

That event-driven automation is the core reason this project fits the hackathon requirement.

## Architecture

### 1. Origin Contract

File:
- `contracts/reactive/AreYouOKReactiveController.sol`

Responsibility:
- stores the owner's heartbeat
- emits `HeartbeatRecorded` when the owner checks in
- emits `MissedHeartbeatReported` when the beneficiary reports inactivity

### 2. Reactive Contract

File:
- `contracts/reactive/AreYouOKReactive.sol`
- `contracts/reactive/ReactiveNetwork.sol`

Responsibility:
- subscribes to Origin events on Reactive Network
- interprets heartbeat and missed-heartbeat logs
- emits callback instructions toward the Destination vault

### 3. Destination Contract

File:
- `contracts/reactive/AreYouOKReactiveVault.sol`

Responsibility:
- escrows ETH
- accepts callback execution only from the official callback proxy
- verifies the authorized RVM id before syncing heartbeat or releasing inheritance

### 4. Factory Contract

File:
- `contracts/reactive/AreYouOKReactiveFactory.sol`

Responsibility:
- deploys controller + vault pairs for each user
- keeps owner and beneficiary indexes for the frontend

## Contract Files

- `contracts/reactive/ReactivePrimitives.sol`
- `contracts/reactive/ReactiveNetwork.sol`
- `contracts/reactive/AreYouOKReactive.sol`
- `contracts/reactive/AreYouOKReactiveController.sol`
- `contracts/reactive/AreYouOKReactiveVault.sol`
- `contracts/reactive/AreYouOKReactiveFactory.sol`

## Frontend

The frontend has been adapted to the Reactive version of the protocol and now points to the deployed Sepolia / Lasna demo addresses through `.env.local`:

- `app/page.tsx`
- `app/components/CreateSwitchForm.tsx`
- `app/components/SwitchCard.tsx`
- `contracts/abi.ts`

The UI now explains and interacts with the Reactive flow instead of the old single-contract assumption.

## Deployment Files

- `script/deploy-reactive-are-you-ok.ps1`
- `.env.example`
- `.env.deploy.example`
- `foundry.toml`

## Submission Materials

- `docs/DEPLOYED_ADDRESSES.template.md`
- `docs/WORKFLOW_AND_TX_HASHES.template.md`

These are now filled with the real deployed addresses and end-to-end transaction hashes used for the demo flow.

## End-To-End Workflow

### Deployment Phase

1. Deploy `AreYouOKReactive` on Reactive Network.
2. Deploy `AreYouOKReactiveFactory`.
3. Create a switch pair from the factory.
4. Configure subscription for the created controller if your deployment flow requires manual subscription setup.

### Runtime Phase

1. The owner creates a switch pair and optionally deposits ETH into the vault.
2. The owner periodically calls `checkIn()` on the Origin controller.
3. The Origin contract emits `HeartbeatRecorded`.
4. The Reactive contract receives the event and emits a callback for `syncHeartbeat(...)`.
5. The Destination vault updates `lastCheckIn` and `deadline`.
6. If the owner stops checking in and the deadline passes, the beneficiary calls `reportMissedHeartbeat()`.
7. The Origin contract emits `MissedHeartbeatReported`.
8. The Reactive contract receives the event and emits a callback for `releaseInheritance(...)`.
9. The Destination vault transfers ETH to the beneficiary.

## Hackathon Checklist

This repository now covers the main required submission items:

- reactive contract code
- destination contract code
- origin contract code
- deployment script scaffold
- problem and solution explanation
- written workflow explanation
- deployed-address template
- transaction-hash template

Before final submission, you still need to:

1. publish the final public GitHub repository
2. record and upload the demo video under 5 minutes
3. paste the repository link and team information into the submission form

## Local Development

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3001` if you run the dev server on port `3001`.

## How to Use

1. Connect your wallet.
2. Set a beneficiary address and create a new switch pair.
3. Optionally deposit ETH into the destination vault.
4. As the owner, keep the switch alive by sending regular heartbeats.
5. If the heartbeat window expires, the beneficiary can report the missed heartbeat on the origin chain.
6. The Reactive contract forwards the callback automatically.
7. The Destination vault syncs the heartbeat or releases the inheritance automatically.

## Deployment Setup

1. Install Foundry so `forge` and `cast` are available.
2. Copy `.env.deploy.example` to `.env.deploy.local`.
3. Fill in:
   - `PRIVATE_KEY`
   - `REACTIVE_RPC_URL`
   - `REACTIVE_SERVICE_ADDRESS`
   - `EXECUTION_RPC_URL`
   - `ORIGIN_CHAIN_ID`
   - `DESTINATION_CHAIN_ID`
4. Deploy `AreYouOKReactive` on Reactive Network.
5. Deploy `AreYouOKReactiveFactory` on the execution chain with the callback sender and authorized RVM id.
6. Copy the deployed addresses into `.env.local` for the frontend.
7. Restart the app and verify the UI points to the new contracts.

## Environment Variables

Copy `.env.example` and replace the placeholder values:

```bash
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_REACTIVE_CONTRACT=0x...
NEXT_PUBLIC_CALLBACK_SENDER=0x...
NEXT_PUBLIC_ORIGIN_CHAIN_ID=11155111
NEXT_PUBLIC_DESTINATION_CHAIN_ID=11155111
NEXT_PUBLIC_HEARTBEAT_INTERVAL_SECONDS=259200
```

## Demo Script Suggestion

For the 5-minute demo video:

1. Show the architecture slide or README summary.
2. Show the deployed contract addresses.
3. Create one switch pair.
4. Send one heartbeat from the owner.
5. Show the Reactive callback and destination sync.
6. Wait or simulate expiry.
7. Report missed heartbeat from the beneficiary.
8. Show the Reactive callback and inheritance release.
9. Show the three categories of tx hashes: Origin, Reactive, Destination.

## Notes

This repo started as a simpler dead-man's-switch demo and was adapted into a real Reactive Network submission. The current codebase includes a successful end-to-end Origin / Reactive / Destination flow, documented deployed addresses, and recorded transaction hashes.
