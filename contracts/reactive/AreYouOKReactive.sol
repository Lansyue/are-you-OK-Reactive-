// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ReactiveNetwork.sol";

interface IAreYouOKReactiveVault {
    function syncHeartbeat(address rvmId, uint256 observedAt, uint256 nextDeadline, uint256 originTxHash) external;

    function releaseInheritance(address rvmId, uint256 observedAt, uint256 originTxHash) external;
}

contract AreYouOKReactive is AbstractReactive {
    uint256 public immutable originChainId;
    uint256 public immutable destinationChainId;
    uint64 public immutable callbackGasLimit;
    address public owner;

    uint256 public constant HEARTBEAT_RECORDED_TOPIC =
        uint256(keccak256("HeartbeatRecorded(address,address,uint256,uint256)"));
    uint256 public constant MISSED_HEARTBEAT_REPORTED_TOPIC =
        uint256(keccak256("MissedHeartbeatReported(address,address,uint256,uint256)"));

    event ReactedToHeartbeat(address indexed vault, uint256 observedAt, uint256 nextDeadline, bytes32 indexed txHash);
    event ReactedToMissedHeartbeat(
        address indexed vault,
        uint256 observedAt,
        uint256 expectedDeadline,
        bytes32 indexed txHash
    );
    event Subscribed(address indexed controller);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 originChainId_, uint256 destinationChainId_, uint64 callbackGasLimit_) payable {
        require(originChainId_ > 0, "Invalid origin chain");
        require(destinationChainId_ > 0, "Invalid destination chain");
        require(callbackGasLimit_ > 0, "Invalid gas");

        owner = msg.sender;
        originChainId = originChainId_;
        destinationChainId = destinationChainId_;
        callbackGasLimit = callbackGasLimit_;
    }

    function configureSubscription(address controllerEmitter) external rnOnly onlyOwner {
        require(controllerEmitter != address(0), "Invalid emitter");

        service.subscribe(
            originChainId,
            controllerEmitter,
            HEARTBEAT_RECORDED_TOPIC,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );

        service.subscribe(
            originChainId,
            controllerEmitter,
            MISSED_HEARTBEAT_REPORTED_TOPIC,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );

        emit Subscribed(controllerEmitter);
    }

    function react(LogRecord calldata logRecord) external vmOnly {
        require(logRecord.chain_id == originChainId, "Unexpected chain");

        if (logRecord.topic_0 == HEARTBEAT_RECORDED_TOPIC) {
            address vault = address(uint160(logRecord.topic_1));
            (uint256 observedAt, uint256 nextDeadline) = abi.decode(logRecord.data, (uint256, uint256));

            bytes memory payload = abi.encodeWithSelector(
                IAreYouOKReactiveVault.syncHeartbeat.selector,
                address(0),
                observedAt,
                nextDeadline,
                logRecord.tx_hash
            );

            emit Callback(destinationChainId, vault, callbackGasLimit, payload);

            emit ReactedToHeartbeat(vault, observedAt, nextDeadline, bytes32(logRecord.tx_hash));
            return;
        }

        if (logRecord.topic_0 == MISSED_HEARTBEAT_REPORTED_TOPIC) {
            address vault = address(uint160(logRecord.topic_1));
            (uint256 observedAt, uint256 expectedDeadline) = abi.decode(logRecord.data, (uint256, uint256));

            bytes memory payload = abi.encodeWithSelector(
                IAreYouOKReactiveVault.releaseInheritance.selector,
                address(0),
                observedAt,
                logRecord.tx_hash
            );

            emit Callback(destinationChainId, vault, callbackGasLimit, payload);

            emit ReactedToMissedHeartbeat(vault, observedAt, expectedDeadline, bytes32(logRecord.tx_hash));
        }
    }
}
