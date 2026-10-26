// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Tiketa} from "../src/Tiketa.sol";
import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TiketaTest is Test {
    Tiketa public tiketa;

    address public organizer = address(0xABCD);
    address public buyer1 = address(0x1111);
    address public buyer2 = address(0x2222);
    address public attacker = address(0x6666);

    uint256 public constant GA_ID = 1;
    uint256 public constant GA_SUPPLY = 100;
    uint256 public constant GA_PRICE = 0.01 ether;

    uint256 public constant VIP_ID = 2;
    uint256 public constant VIP_SUPPLY = 10;
    uint256 public constant VIP_PRICE = 0.05 ether;

    event TierCreated(uint256 indexed id, string name, uint256 maxSupply, uint256 price);
    event PriceUpdated(uint256 indexed id, uint256 oldPrice, uint256 newPrice);
    event TierStatusUpdated(uint256 indexed id, bool active);
    event TicketsPurchased(address indexed buyer, uint256 indexed id, uint256 amount, uint256 totalPrice);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    function setUp() public {
        vm.deal(organizer, 10 ether);
        vm.deal(buyer1, 100 ether);
        vm.deal(buyer2, 100 ether);
        vm.deal(attacker, 10 ether);

        vm.startPrank(organizer);
        tiketa = new Tiketa(organizer, "https://api.tiketa.xyz/metadata/{id}.json");

        // Create default tiers
        tiketa.createTier(GA_ID, "General Admission", GA_SUPPLY, GA_PRICE);
        tiketa.createTier(VIP_ID, "VIP", VIP_SUPPLY, VIP_PRICE);
        vm.stopPrank();
    }

    // --- Tier Creation Tests ---

    function test_InitialTiersConfigured() public view {
        (
            string memory name,
            uint256 maxSupply,
            uint256 price,
            uint256 currentSupply,
            uint256 remainingSupply,
            bool active,
            bool exists
        ) = tiketa.tierInfo(GA_ID);

        assertEq(name, "General Admission");
        assertEq(maxSupply, GA_SUPPLY);
        assertEq(price, GA_PRICE);
        assertEq(currentSupply, 0);
        assertEq(remainingSupply, GA_SUPPLY);
        assertTrue(active);
        assertTrue(exists);

        assertEq(tiketa.remaining(GA_ID), GA_SUPPLY);
        assertEq(tiketa.totalTiers(), 2);
    }

    function test_CreateTier_Success() public {
        vm.prank(organizer);
        vm.expectEmit(true, false, false, true);
        emit TierCreated(3, "Early Bird", 50, 0.005 ether);
        tiketa.createTier(3, "Early Bird", 50, 0.005 ether);

        (
            string memory name,
            uint256 maxSupply,
            uint256 price,
            uint256 currentSupply,
            uint256 remainingSupply,
            bool active,
            bool exists
        ) = tiketa.tierInfo(3);

        assertEq(name, "Early Bird");
        assertEq(maxSupply, 50);
        assertEq(price, 0.005 ether);
        assertEq(currentSupply, 0);
        assertEq(remainingSupply, 50);
        assertTrue(active);
        assertTrue(exists);
        assertEq(tiketa.totalTiers(), 3);
    }

    function test_RevertWhen_NonOwnerCreatesTier() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                attacker
            )
        );
        tiketa.createTier(3, "Backstage", 20, 0.1 ether);
    }

    function test_RevertWhen_CreatingTierZeroId() public {
        vm.prank(organizer);
        vm.expectRevert(Tiketa.InvalidTierId.selector);
        tiketa.createTier(0, "Invalid ID", 100, 0.01 ether);
    }

    function test_RevertWhen_CreatingTierDuplicateId() public {
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(Tiketa.TierAlreadyExists.selector, GA_ID));
        tiketa.createTier(GA_ID, "Duplicate GA", 200, 0.02 ether);
    }

    function test_RevertWhen_CreatingTierZeroSupply() public {
        vm.prank(organizer);
        vm.expectRevert(Tiketa.InvalidMaxSupply.selector);
        tiketa.createTier(3, "Zero Supply", 0, 0.01 ether);
    }

    // --- Purchase Tests ---

    function test_Buy_ExactPayment_Success() public {
        uint256 amount = 3;
        uint256 totalCost = GA_PRICE * amount;

        vm.prank(buyer1);
        vm.expectEmit(true, true, false, true);
        emit TicketsPurchased(buyer1, GA_ID, amount, totalCost);
        tiketa.buy{value: totalCost}(GA_ID, amount);

        assertEq(tiketa.balanceOf(buyer1, GA_ID), amount);
        assertEq(tiketa.totalSupply(GA_ID), amount);
        assertEq(tiketa.remaining(GA_ID), GA_SUPPLY - amount);
        assertEq(address(tiketa).balance, totalCost);
    }

    function test_RevertWhen_Underpayment() public {
        uint256 amount = 2;
        uint256 requiredCost = GA_PRICE * amount; // 0.02 ether
        uint256 underpayment = 0.01 ether;

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Tiketa.ExactPaymentRequired.selector,
                requiredCost,
                underpayment
            )
        );
        tiketa.buy{value: underpayment}(GA_ID, amount);
    }

    function test_RevertWhen_Overpayment() public {
        uint256 amount = 2;
        uint256 requiredCost = GA_PRICE * amount; // 0.02 ether
        uint256 overpayment = 0.03 ether;

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Tiketa.ExactPaymentRequired.selector,
                requiredCost,
                overpayment
            )
        );
        tiketa.buy{value: overpayment}(GA_ID, amount);
    }

    function test_RevertWhen_ZeroAmountBuy() public {
        vm.prank(buyer1);
        vm.expectRevert(Tiketa.ZeroAmount.selector);
        tiketa.buy{value: 0}(GA_ID, 0);
    }

    function test_RevertWhen_BuyingNonExistentTier() public {
        vm.prank(buyer1);
        vm.expectRevert(abi.encodeWithSelector(Tiketa.TierDoesNotExist.selector, 999));
        tiketa.buy{value: 0.01 ether}(999, 1);
    }

    function test_RevertWhen_TierInactive() public {
        vm.prank(organizer);
        tiketa.setTierActive(GA_ID, false);

        vm.prank(buyer1);
        vm.expectRevert(abi.encodeWithSelector(Tiketa.TierNotActive.selector, GA_ID));
        tiketa.buy{value: GA_PRICE}(GA_ID, 1);
    }

    function test_SupplyCapEnforcement_ExactCapReached() public {
        // VIP cap is 10
        vm.prank(buyer1);
        tiketa.buy{value: VIP_PRICE * VIP_SUPPLY}(VIP_ID, VIP_SUPPLY);

        assertEq(tiketa.totalSupply(VIP_ID), VIP_SUPPLY);
        assertEq(tiketa.remaining(VIP_ID), 0);

        // Buyer2 tries to purchase 1 more when supply is 0
        vm.prank(buyer2);
        vm.expectRevert(
            abi.encodeWithSelector(
                Tiketa.MaxSupplyExceeded.selector,
                VIP_ID,
                1,
                0
            )
        );
        tiketa.buy{value: VIP_PRICE}(VIP_ID, 1);
    }

    function test_SupplyCapEnforcement_ExceedingAvailable() public {
        // Buy 8 out of 10 VIP tickets
        vm.prank(buyer1);
        tiketa.buy{value: VIP_PRICE * 8}(VIP_ID, 8);
        assertEq(tiketa.remaining(VIP_ID), 2);

        // Try to buy 3 tickets when only 2 are available
        vm.prank(buyer2);
        vm.expectRevert(
            abi.encodeWithSelector(
                Tiketa.MaxSupplyExceeded.selector,
                VIP_ID,
                3,
                2
            )
        );
        tiketa.buy{value: VIP_PRICE * 3}(VIP_ID, 3);
    }

    // --- Organizer Functions Tests ---

    function test_SetPrice_Success() public {
        uint256 newPrice = 0.02 ether;

        vm.prank(organizer);
        vm.expectEmit(true, false, false, true);
        emit PriceUpdated(GA_ID, GA_PRICE, newPrice);
        tiketa.setPrice(GA_ID, newPrice);

        (, , uint256 price, , , , ) = tiketa.tierInfo(GA_ID);
        assertEq(price, newPrice);

        // Buy with new price
        vm.prank(buyer1);
        tiketa.buy{value: newPrice}(GA_ID, 1);
        assertEq(tiketa.balanceOf(buyer1, GA_ID), 1);
    }

    function test_RevertWhen_NonOwnerSetsPrice() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                attacker
            )
        );
        tiketa.setPrice(GA_ID, 0.001 ether);
    }

    function test_SetTierActive_Success() public {
        vm.prank(organizer);
        vm.expectEmit(true, false, false, true);
        emit TierStatusUpdated(GA_ID, false);
        tiketa.setTierActive(GA_ID, false);

        (, , , , , bool active, ) = tiketa.tierInfo(GA_ID);
        assertFalse(active);

        // Reactivate
        vm.prank(organizer);
        tiketa.setTierActive(GA_ID, true);
        (, , , , , active, ) = tiketa.tierInfo(GA_ID);
        assertTrue(active);
    }

    function test_RevertWhen_NonOwnerSetsTierActive() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                attacker
            )
        );
        tiketa.setTierActive(GA_ID, false);
    }

    // --- Withdraw Tests ---

    function test_Withdraw_Success() public {
        // Buyer1 purchases 5 GA tickets
        uint256 purchaseAmount = 5;
        uint256 totalCost = GA_PRICE * purchaseAmount;

        vm.prank(buyer1);
        tiketa.buy{value: totalCost}(GA_ID, purchaseAmount);
        assertEq(address(tiketa).balance, totalCost);

        uint256 organizerBalanceBefore = organizer.balance;

        vm.prank(organizer);
        vm.expectEmit(true, false, false, true);
        emit FundsWithdrawn(organizer, totalCost);
        tiketa.withdraw();

        assertEq(address(tiketa).balance, 0);
        assertEq(organizer.balance, organizerBalanceBefore + totalCost);
    }

    function test_RevertWhen_NonOwnerWithdraws() public {
        vm.prank(buyer1);
        tiketa.buy{value: GA_PRICE}(GA_ID, 1);

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                attacker
            )
        );
        tiketa.withdraw();
    }

    function test_RevertWhen_WithdrawWithZeroBalance() public {
        vm.prank(organizer);
        vm.expectRevert(Tiketa.NothingToWithdraw.selector);
        tiketa.withdraw();
    }

    // --- Transferability (ERC-1155) Tests ---

    function test_ERC1155_SafeTransferFrom_Works() public {
        vm.prank(buyer1);
        tiketa.buy{value: GA_PRICE * 4}(GA_ID, 4);

        assertEq(tiketa.balanceOf(buyer1, GA_ID), 4);
        assertEq(tiketa.balanceOf(buyer2, GA_ID), 0);

        // Buyer1 transfers 2 tickets to Buyer2
        vm.prank(buyer1);
        tiketa.safeTransferFrom(buyer1, buyer2, GA_ID, 2, "");

        assertEq(tiketa.balanceOf(buyer1, GA_ID), 2);
        assertEq(tiketa.balanceOf(buyer2, GA_ID), 2);
    }

    function test_ERC1155_SafeBatchTransferFrom_Works() public {
        vm.startPrank(buyer1);
        tiketa.buy{value: GA_PRICE * 2}(GA_ID, 2);
        tiketa.buy{value: VIP_PRICE * 1}(VIP_ID, 1);

        uint256[] memory ids = new uint256[](2);
        ids[0] = GA_ID;
        ids[1] = VIP_ID;

        uint256[] memory values = new uint256[](2);
        values[0] = 1;
        values[1] = 1;

        tiketa.safeBatchTransferFrom(buyer1, buyer2, ids, values, "");
        vm.stopPrank();

        assertEq(tiketa.balanceOf(buyer1, GA_ID), 1);
        assertEq(tiketa.balanceOf(buyer1, VIP_ID), 0);
        assertEq(tiketa.balanceOf(buyer2, GA_ID), 1);
        assertEq(tiketa.balanceOf(buyer2, VIP_ID), 1);
    }

    // --- Fuzz Testing ---

    function testFuzz_Buy_ValidAmounts(uint8 buyAmount) public {
        // Bound buyAmount between 1 and VIP_SUPPLY (10)
        vm.assume(buyAmount >= 1 && buyAmount <= VIP_SUPPLY);

        uint256 amount = uint256(buyAmount);
        uint256 cost = VIP_PRICE * amount;

        vm.prank(buyer1);
        tiketa.buy{value: cost}(VIP_ID, amount);

        assertEq(tiketa.balanceOf(buyer1, VIP_ID), amount);
        assertEq(tiketa.totalSupply(VIP_ID), amount);
        assertEq(tiketa.remaining(VIP_ID), VIP_SUPPLY - amount);
    }

    function test_Remaining_NonExistentTier() public {
        vm.expectRevert(abi.encodeWithSelector(Tiketa.TierDoesNotExist.selector, 888));
        tiketa.remaining(888);
    }
}
