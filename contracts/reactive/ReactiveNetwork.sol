// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPayable {
    function debt(address _contract) external view returns (uint256);
}

interface ISubscriptionService {
    function subscribe(
        uint256 chain_id,
        address _contract,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 topic_3
    ) external;

    function unsubscribe(
        uint256 chain_id,
        address _contract,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 topic_3
    ) external;
}

interface ISystemContract is IPayable, ISubscriptionService {}

struct LogRecord {
    uint256 chain_id;
    address _contract;
    uint256 topic_0;
    uint256 topic_1;
    uint256 topic_2;
    uint256 topic_3;
    bytes data;
    uint256 block_number;
    uint256 op_code;
    uint256 block_hash;
    uint256 tx_hash;
    uint256 log_index;
}

interface IReactive {
    event Callback(
        uint256 indexed chain_id,
        address indexed _contract,
        uint64 indexed gas_limit,
        bytes payload
    );

    function react(LogRecord calldata log) external;
}

abstract contract AbstractPayer {
    mapping(address => bool) internal senders;
    IPayable public vendor;

    modifier authorizedSenderOnly() {
        require(senders[msg.sender], "Authorized sender only");
        _;
    }

    function addAuthorizedSender(address sender) internal {
        senders[sender] = true;
    }

    function pay(uint256 amount) external authorizedSenderOnly {
        _pay(payable(msg.sender), amount);
    }

    function coverDebt() external {
        uint256 amount = vendor.debt(address(this));
        _pay(payable(address(vendor)), amount);
    }

    function _pay(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Insufficient funds");

        if (amount > 0) {
            (bool success,) = recipient.call{value: amount}("");
            require(success, "Transfer failed");
        }
    }

    receive() external payable virtual {}
}

abstract contract AbstractReactive is AbstractPayer, IReactive {
    uint256 internal constant REACTIVE_IGNORE =
        0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;
    ISystemContract internal constant SERVICE_ADDR = ISystemContract(0x0000000000000000000000000000000000fffFfF);

    ISystemContract public service;
    bool public vm;

    modifier vmOnly() {
        require(vm, "VM only");
        _;
    }

    modifier rnOnly() {
        require(!vm, "Reactive network only");
        _;
    }

    constructor() {
        vendor = service = SERVICE_ADDR;
        addAuthorizedSender(address(SERVICE_ADDR));
        detectVm();
    }

    function detectVm() internal {
        uint256 size;
        assembly {
            size := extcodesize(0x0000000000000000000000000000000000fffFfF)
        }
        vm = size == 0;
    }
}
