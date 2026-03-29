# Workflow And Transaction Hashes

Replace every `TBD` with a real transaction hash before submission.

## Problem

`Are You OK?` is a dead-man's-switch dApp.

The owner must periodically prove they are still active. If they disappear, the beneficiary should receive the escrowed funds. The hard part is not the business logic itself, but the cross-step automation between event detection and the next on-chain action.

Without Reactive Network, this requires an off-chain watcher, bot, or manual operator to monitor events and trigger the destination-chain settlement transaction.

Reactive Network solves that by letting a Reactive Contract listen to Origin-chain EVM events and automatically emit the callback transaction toward the Destination contract.

## Deployment Flow

1. Deploy `AreYouOKReactive` on Reactive Network.
   - Tx hash: `TBD`
2. Deploy `AreYouOKReactiveFactory`.
   - Tx hash: `TBD`
3. Create a switch pair from the factory.
   - Tx hash: `TBD`
4. Configure the created controller as a subscription source if needed.
   - Tx hash: `TBD`

## Runtime Flow

1. Owner creates a switch pair and optionally funds the vault.
   - Origin tx hash: `TBD`
   - Destination tx hash if separate: `TBD`
2. Owner calls `checkIn()` on the Origin controller.
   - Origin tx hash: `TBD`
3. Reactive contract receives `HeartbeatRecorded` and emits callback for `syncHeartbeat(...)`.
   - Reactive tx hash: `TBD`
4. Destination vault updates `lastCheckIn` and `deadline`.
   - Destination tx hash: `TBD`
5. After expiry, beneficiary calls `reportMissedHeartbeat()` on the Origin controller.
   - Origin tx hash: `TBD`
6. Reactive contract receives `MissedHeartbeatReported` and emits callback for `releaseInheritance(...)`.
   - Reactive tx hash: `TBD`
7. Destination vault releases funds to the beneficiary.
   - Destination tx hash: `TBD`

## Submission Reminder

Make sure the final version includes:

- every Origin tx hash
- every Reactive tx hash
- every Destination tx hash
- the final beneficiary payout hash

## Video Checklist

- Show the addresses from `DEPLOYED_ADDRESSES.template.md`
- Show at least one heartbeat flow
- Show one missed-heartbeat settlement flow
- Show tx hashes clearly on screen
- Keep the total video under 5 minutes
