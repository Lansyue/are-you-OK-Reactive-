// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AreYouOKReactiveVault {
    address public immutable owner;
    address public immutable beneficiary;
    address public immutable callbackSender;
    address public immutable authorizedRvmId;
    uint256 public immutable heartbeatInterval;

    uint256 public lastCheckIn;
    uint256 public deadline;
    bool public settled;

    event Deposited(address indexed from, uint256 amount);
    event HeartbeatSynced(uint256 indexed observedAt, uint256 nextDeadline, bytes32 indexed originTxHash);
    event InheritanceReleased(address indexed beneficiary, uint256 amount, bytes32 indexed originTxHash);

    modifier onlyCallbackSender() {
        require(msg.sender == callbackSender, "Only callback sender");
        _;
    }

    modifier onlyAuthorizedRvm(address rvmId) {
        require(authorizedRvmId == address(0) || authorizedRvmId == rvmId, "Authorized RVM only");
        _;
    }

    modifier notSettled() {
        require(!settled, "Already settled");
        _;
    }

    constructor(
        address owner_,
        address beneficiary_,
        address callbackSender_,
        address authorizedRvmId_,
        uint256 heartbeatInterval_
    ) {
        require(owner_ != address(0), "Invalid owner");
        require(beneficiary_ != address(0), "Invalid beneficiary");
        require(callbackSender_ != address(0), "Invalid callback sender");
        require(authorizedRvmId_ != address(0), "Invalid RVM");
        require(owner_ != beneficiary_, "Owner == beneficiary");
        require(heartbeatInterval_ > 0, "Invalid interval");

        owner = owner_;
        beneficiary = beneficiary_;
        callbackSender = callbackSender_;
        authorizedRvmId = authorizedRvmId_;
        heartbeatInterval = heartbeatInterval_;
        lastCheckIn = block.timestamp;
        deadline = block.timestamp + heartbeatInterval_;
    }

    function deposit() external payable notSettled {
        require(msg.value > 0, "Amount must be > 0");
        emit Deposited(msg.sender, msg.value);
    }

    function syncHeartbeat(
        address rvmId,
        uint256 observedAt,
        uint256 nextDeadline,
        uint256 originTxHash
    ) external onlyCallbackSender onlyAuthorizedRvm(rvmId) notSettled {
        require(observedAt >= lastCheckIn, "Outdated heartbeat");
        require(nextDeadline >= observedAt, "Bad deadline");

        lastCheckIn = observedAt;
        deadline = nextDeadline;

        emit HeartbeatSynced(observedAt, nextDeadline, bytes32(originTxHash));
    }

    function releaseInheritance(
        address rvmId,
        uint256 observedAt,
        uint256 originTxHash
    ) external onlyCallbackSender onlyAuthorizedRvm(rvmId) notSettled {
        require(observedAt >= deadline, "Heartbeat still valid");

        settled = true;
        uint256 balance = address(this).balance;

        if (balance > 0) {
            (bool success, ) = beneficiary.call{value: balance}("");
            require(success, "Transfer failed");
        }

        emit InheritanceReleased(beneficiary, balance, bytes32(originTxHash));
    }

    function isExpired() public view returns (bool) {
        return block.timestamp >= deadline;
    }

    function getRemainingTime() public view returns (uint256) {
        if (block.timestamp >= deadline) {
            return 0;
        }

        return deadline - block.timestamp;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }
}
