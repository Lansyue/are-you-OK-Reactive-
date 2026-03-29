// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AreYouOKReactiveController.sol";
import "./AreYouOKReactiveVault.sol";

contract AreYouOKReactiveFactory {
    struct SwitchPair {
        address vault;
        address controller;
        address owner;
        address beneficiary;
        uint256 heartbeatInterval;
        uint256 createdAt;
    }

    address public immutable callbackSender;
    address public immutable authorizedRvmId;
    uint256 public immutable defaultHeartbeatInterval;

    address[] public allVaults;
    mapping(address => address[]) public ownerSwitches;
    mapping(address => address[]) public beneficiarySwitches;
    mapping(address => SwitchPair) public switchPairs;

    event SwitchPairCreated(
        address indexed vault,
        address indexed controller,
        address indexed owner,
        address beneficiary,
        uint256 heartbeatInterval,
        uint256 createdAt
    );

    constructor(address callbackSender_, address authorizedRvmId_, uint256 defaultHeartbeatInterval_) {
        require(callbackSender_ != address(0), "Invalid callback sender");
        require(authorizedRvmId_ != address(0), "Invalid RVM");
        require(defaultHeartbeatInterval_ > 0, "Invalid interval");

        callbackSender = callbackSender_;
        authorizedRvmId = authorizedRvmId_;
        defaultHeartbeatInterval = defaultHeartbeatInterval_;
    }

    function createSwitch(address beneficiary_) external payable returns (address vault, address controller) {
        return createSwitchWithInterval(beneficiary_, defaultHeartbeatInterval);
    }

    function createSwitchWithInterval(
        address beneficiary_,
        uint256 heartbeatInterval_
    ) public payable returns (address vault, address controller) {
        require(beneficiary_ != address(0), "Invalid beneficiary");
        require(beneficiary_ != msg.sender, "Owner == beneficiary");
        require(heartbeatInterval_ > 0, "Invalid interval");

        AreYouOKReactiveVault newVault = new AreYouOKReactiveVault(
            msg.sender,
            beneficiary_,
            callbackSender,
            authorizedRvmId,
            heartbeatInterval_
        );

        AreYouOKReactiveController newController = new AreYouOKReactiveController(
            msg.sender,
            beneficiary_,
            address(newVault),
            heartbeatInterval_
        );

        vault = address(newVault);
        controller = address(newController);

        if (msg.value > 0) {
            (bool success, ) = vault.call{value: msg.value}("");
            require(success, "Initial deposit failed");
        }

        ownerSwitches[msg.sender].push(vault);
        beneficiarySwitches[beneficiary_].push(vault);
        allVaults.push(vault);

        switchPairs[vault] = SwitchPair({
            vault: vault,
            controller: controller,
            owner: msg.sender,
            beneficiary: beneficiary_,
            heartbeatInterval: heartbeatInterval_,
            createdAt: block.timestamp
        });

        emit SwitchPairCreated(vault, controller, msg.sender, beneficiary_, heartbeatInterval_, block.timestamp);
    }

    function getOwnerSwitches(address owner_) external view returns (address[] memory) {
        return ownerSwitches[owner_];
    }

    function getBeneficiarySwitches(address beneficiary_) external view returns (address[] memory) {
        return beneficiarySwitches[beneficiary_];
    }

    function getSwitchPair(address vault_) external view returns (SwitchPair memory) {
        return switchPairs[vault_];
    }

    function getTotalSwitches() external view returns (uint256) {
        return allVaults.length;
    }
}
