// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct LogRecord {
    uint256 chainId;
    address emitter;
    bytes32 topic0;
    bytes32 topic1;
    bytes32 topic2;
    bytes32 topic3;
    bytes data;
    bytes32 txHash;
    uint256 blockNumber;
    uint256 timestamp;
}

abstract contract ReactiveBase {
    address public immutable service;
    address public immutable owner;

    event Callback(
        uint256 indexed chainId,
        address indexed target,
        uint256 value,
        uint64 gasLimit,
        bytes payload
    );

    event SubscriptionConfigured(uint256 indexed chainId, address indexed emitter, bytes32 indexed topic0);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier vmOnly() virtual {
        _;
    }

    constructor(address service_) {
        service = service_;
        owner = msg.sender;
    }
}
