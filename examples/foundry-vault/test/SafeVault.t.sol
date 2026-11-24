// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SafeVault} from "../src/SafeVault.sol";

contract SafeVaultTest is Test {
    SafeVault vault;
    address guardian = address(0xBEEF);
    address alice = address(0xA11CE);

    function setUp() public {
        vault = new SafeVault(guardian);
        vm.deal(alice, 10 ether);
    }

    function testFuzz_DepositAndWithdraw(uint96 amount) public {
        vm.assume(amount > 0 && amount <= 10 ether);
        vm.startPrank(alice);
        vault.deposit{value: amount}();
        assertEq(vault.balances(alice), amount);
        vault.withdraw(amount);
        assertEq(vault.balances(alice), 0);
        vm.stopPrank();
    }

    function test_GuardianCanPauseCannotUnpause() public {
        vm.prank(guardian);
        vault.pause();
        assertTrue(vault.paused());

        vm.prank(guardian);
        vm.expectRevert(SafeVault.NotOwner.selector);
        vault.unpause();
    }
}
