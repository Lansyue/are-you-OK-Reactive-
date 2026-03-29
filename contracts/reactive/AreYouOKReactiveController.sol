// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AreYouOKReactiveController {
    address public immutable owner;
    address public immutable beneficiary;
    address public immutable vault;
    uint256 public immutable heartbeatInterval;

    uint256 public lastHeartbeat;

    event SwitchRegistered(
        address indexed vault,
        address indexed owner,
        address indexed beneficiary,
        uint256 heartbeatInterval,
        uint256 firstDeadline
    );
    event HeartbeatRecorded(
        address indexed vault,
        address indexed owner,
        uint256 observedAt,
        uint256 nextDeadline
    );
    event MissedHeartbeatReported(
        address indexed vault,
        address indexed reporter,
        uint256 observedAt,
        uint256 expectedDeadline
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Only beneficiary");
        _;
    }

    constructor(
        address owner_,
        address beneficiary_,
        address vault_,
        uint256 heartbeatInterval_
    ) {
        require(owner_ != address(0), "Invalid owner");
        require(beneficiary_ != address(0), "Invalid beneficiary");
        require(vault_ != address(0), "Invalid vault");
        require(heartbeatInterval_ > 0, "Invalid interval");

        owner = owner_;
        beneficiary = beneficiary_;
        vault = vault_;
        heartbeatInterval = heartbeatInterval_;
        lastHeartbeat = block.timestamp;

        emit SwitchRegistered(vault_, owner_, beneficiary_, heartbeatInterval_, block.timestamp + heartbeatInterval_);
    }

    function checkIn() external onlyOwner {
        lastHeartbeat = block.timestamp;
        emit HeartbeatRecorded(vault, owner, block.timestamp, block.timestamp + heartbeatInterval);
    }

    function reportMissedHeartbeat() external onlyBeneficiary {
        uint256 expectedDeadline = lastHeartbeat + heartbeatInterval;
        require(block.timestamp >= expectedDeadline, "Switch still alive");

        emit MissedHeartbeatReported(vault, msg.sender, block.timestamp, expectedDeadline);
    }

    function getDeadline() external view returns (uint256) {
        return lastHeartbeat + heartbeatInterval;
    }
}
