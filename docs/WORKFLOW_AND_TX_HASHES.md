# Workflow And Transaction Hashes

## Problem

`Are You OK?` is a dead-man's-switch dApp.

The owner must periodically prove they are still active. If they disappear, the beneficiary should receive the escrowed funds. The hard part is not the business logic itself, but the cross-step automation between event detection and the next on-chain action.

Without Reactive Network, this requires an off-chain watcher, bot, or manual operator to monitor events and trigger the destination-chain settlement transaction.

Reactive Network solves that by letting a Reactive Contract listen to Origin-chain EVM events and automatically emit the callback transaction toward the Destination contract.

## Deployment Flow

1. Deploy `AreYouOKReactive` on Reactive Network.
   - Tx hash: `0xbbb31e1d0f29ec5ff2c9978603242664ea20239c7f26f19fc31260e75724973a`
2. Deploy `AreYouOKReactiveFactory` on Ethereum Sepolia.
   - Tx hash: `0xa000fedbca878742194e47164612a6c0ff985c017c7bb587046a1b4bc82912c2`
3. Create a switch pair from the factory.
   - Tx hash: `0xeb447dcc8ad74db77a4cea57eebf2ae684e1d76aea23fb0bbf0ba3e19b6174ba`
4. Configure the created controller as a subscription source if needed.
   - Tx hash: `0x8e8ad0984af0478f11026b47141b7cb338ebbc607510ccd6ebcf38b41fd93a3d`

## Runtime Flow

1. Owner creates a switch pair and optionally funds the vault.
   - Origin tx hash: `0xeb447dcc8ad74db77a4cea57eebf2ae684e1d76aea23fb0bbf0ba3e19b6174ba`
   - Destination tx hash if separate: included in factory creation flow
2. Owner calls `checkIn()` on the Origin controller.
   - Origin tx hash: `0x02837e89ee1b5f29b069de23128b0c5c30d86ad8dc644bb81f08556ccc0702b0`
3. Reactive contract receives `HeartbeatRecorded` and emits callback for `syncHeartbeat(...)`.
   - Reactive tx hash: `0x6da527e1d49a9568db90350a1a9cd009acae15c3871008446c213fe6122bddb2`
4. Destination vault updates `lastCheckIn` and `deadline`.
   - Destination tx hash: `0x103daf4333c09eab1680c7ac7d98761fd39f63f34a4f7c596c8167852939213c`
5. After expiry, beneficiary calls `reportMissedHeartbeat()` on the Origin controller.
   - Origin tx hash: `0xa1c04ec8eb076f6c4d3c03644261465f4d5bdc60d4c30517216dea1798121963`
6. Reactive contract receives `MissedHeartbeatReported` and emits callback for `releaseInheritance(...)`.
   - Reactive tx hash: `0xe113b63bb4cd36e976c3736415cc463c5b2c8b6ac893cd5950f94116f353b354`
7. Destination vault releases funds to the beneficiary.
   - Destination tx hash: `0x8b25f38e1de2f9e214b520af9961e772b1c6cb861c2e0b489afe1c8f04639e48`

## Notes

- Before the final successful missed-heartbeat settlement, there were two earlier Reactive attempts while callback reserves were not yet topped up:
  - `0x1a173007b643c6104333f88b129e64fb3d8e724dda26c8bb252c4bffeed5138c`
  - `0xb49709e9e1754e8fb2e20e9d1622c8cd948c41100cc2d9711e55558def06ef83`
- The reserve top-up that enabled the final payout path was:
  - Callback proxy deposit tx: `0x38ed97afd96ecc9e4e0bfc5c864e6c6be23a0f1e06586a77c63fc670ef69eb54`

## Submission Reminder

Make sure the final version includes:

- every Origin tx hash
- every Reactive tx hash
- every Destination tx hash
- the final beneficiary payout hash

## Video Checklist

- Show the addresses from `DEPLOYED_ADDRESSES.md`
- Show at least one heartbeat flow
- Show one missed-heartbeat settlement flow
- Show tx hashes clearly on screen
- Keep the total video under 5 minutes
