param(
  [string]$RpcUrl = $env:REACTIVE_RPC_URL,
  [string]$PrivateKey = $env:PRIVATE_KEY,
  [string]$ReactiveService = $env:REACTIVE_SERVICE_ADDRESS,
  [string]$OriginChainId = $env:ORIGIN_CHAIN_ID,
  [string]$DestinationChainId = $env:DESTINATION_CHAIN_ID,
  [string]$CallbackGasLimit = "900000",
  [string]$DefaultHeartbeatInterval = "259200"
)

if (-not $RpcUrl -or -not $PrivateKey -or -not $ReactiveService -or -not $OriginChainId -or -not $DestinationChainId) {
  throw "Missing env vars. Required: REACTIVE_RPC_URL, PRIVATE_KEY, REACTIVE_SERVICE_ADDRESS, ORIGIN_CHAIN_ID, DESTINATION_CHAIN_ID"
}

Write-Host "1. Deploy AreYouOKReactive on Reactive Network"
Write-Host "forge create contracts/reactive/AreYouOKReactive.sol:AreYouOKReactive --rpc-url $RpcUrl --private-key <hidden> --constructor-args $ReactiveService $OriginChainId $DestinationChainId $CallbackGasLimit"
Write-Host ""
Write-Host "2. Deploy AreYouOKReactiveFactory on the execution chain"
Write-Host "forge create contracts/reactive/AreYouOKReactiveFactory.sol:AreYouOKReactiveFactory --rpc-url <EXECUTION_RPC> --private-key <hidden> --constructor-args <REACTIVE_CALLBACK_SENDER> $DefaultHeartbeatInterval"
Write-Host ""
Write-Host "3. Create a switch pair from the factory"
Write-Host "4. Configure subscription for the controller if your deployment flow requires it"
