// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SafeVault - 最小 CEI + 重入锁 + Guardian 急停金库教学模板（对应 M02 / M08 / M14）
contract SafeVault {
    address public owner;
    address public guardian;
    bool public paused;
    uint256 private locked = 1;

    mapping(address => uint256) public balances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Paused(address indexed by);

    error NotOwner();
    error NotGuardian();
    error IsPaused();
    error Reentrancy();
    error InsufficientBalance();
    error TransferFailed();

    modifier nonReentrant() {
        if (locked == 2) revert Reentrancy();
        locked = 2;
        _;
        locked = 1;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    constructor(address _guardian) {
        owner = msg.sender;
        guardian = _guardian;
    }

    function deposit() external payable whenNotPaused {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        // Checks-Effects-Interactions：先扣账，再外部转账
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdraw(msg.sender, amount);
    }

    /// @notice Guardian 拥有 0 延迟急停权，但无权动用任何用户资金（见 M02.12）
    function pause() external {
        if (msg.sender != guardian && msg.sender != owner) revert NotGuardian();
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external {
        if (msg.sender != owner) revert NotOwner();
        paused = false;
    }
}
