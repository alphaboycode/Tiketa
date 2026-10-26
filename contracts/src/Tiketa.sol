// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Tiketa
 * @notice On-chain event ticketing contract implementing ERC-1155.
 * Each ticket tier is represented by a unique token ID with a capped supply.
 * Tickets are standard ERC-1155 tokens and remain transferable.
 */
contract Tiketa is ERC1155, ERC1155Supply, Ownable, ReentrancyGuard {
    // --- Data Structures ---

    struct Tier {
        string name;
        uint256 maxSupply;
        uint256 price; // Price in native token (BOT/wei)
        bool active;
        bool exists;
    }

    // --- State Variables ---

    string public name;
    string public symbol;

    mapping(uint256 => Tier) public tiers;
    uint256[] public tierIds;

    // --- Custom Errors ---

    error TierAlreadyExists(uint256 id);
    error TierDoesNotExist(uint256 id);
    error TierNotActive(uint256 id);
    error MaxSupplyExceeded(uint256 id, uint256 requested, uint256 available);
    error ExactPaymentRequired(uint256 expected, uint256 received);
    error InvalidMaxSupply();
    error InvalidTierId();
    error ZeroAmount();
    error WithdrawFailed();
    error NothingToWithdraw();

    // --- Events ---

    event TierCreated(uint256 indexed id, string name, uint256 maxSupply, uint256 price);
    event PriceUpdated(uint256 indexed id, uint256 oldPrice, uint256 newPrice);
    event TierStatusUpdated(uint256 indexed id, bool active);
    event TicketsPurchased(address indexed buyer, uint256 indexed id, uint256 amount, uint256 totalPrice);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event UriUpdated(string newUri);

    // --- Constructor ---

    /**
     * @param initialOwner Address of the organizer/owner
     * @param uri_ Base metadata URI for ERC1155 tokens
     */
    constructor(
        address initialOwner,
        string memory uri_
    ) ERC1155(uri_) Ownable(initialOwner) {
        name = "Tiketa Event Tickets";
        symbol = "TIKETA";
    }

    // --- Organizer / Owner Functions ---

    /**
     * @notice Creates a new ticket tier.
     * @param id Unique identifier for the tier
     * @param tierName Human-readable name (e.g. "General Admission", "VIP")
     * @param maxSupply Total ticket supply cap for this tier
     * @param price Price in native currency (BOT / wei) per ticket
     */
    function createTier(
        uint256 id,
        string calldata tierName,
        uint256 maxSupply,
        uint256 price
    ) external onlyOwner {
        if (id == 0) revert InvalidTierId();
        if (tiers[id].exists) revert TierAlreadyExists(id);
        if (maxSupply == 0) revert InvalidMaxSupply();

        tiers[id] = Tier({
            name: tierName,
            maxSupply: maxSupply,
            price: price,
            active: true,
            exists: true
        });

        tierIds.push(id);

        emit TierCreated(id, tierName, maxSupply, price);
    }

    /**
     * @notice Updates the price of an existing tier.
     * @param id Tier identifier
     * @param newPrice New price per ticket in wei
     */
    function setPrice(uint256 id, uint256 newPrice) external onlyOwner {
        if (!tiers[id].exists) revert TierDoesNotExist(id);
        uint256 oldPrice = tiers[id].price;
        tiers[id].price = newPrice;

        emit PriceUpdated(id, oldPrice, newPrice);
    }

    /**
     * @notice Activates or pauses sales for a ticket tier.
     * @param id Tier identifier
     * @param active True to allow purchases, false to pause
     */
    function setTierActive(uint256 id, bool active) external onlyOwner {
        if (!tiers[id].exists) revert TierDoesNotExist(id);
        tiers[id].active = active;

        emit TierStatusUpdated(id, active);
    }

    /**
     * @notice Withdraws all accumulated native token proceeds to the contract owner.
     */
    function withdraw() external nonReentrant onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToWithdraw();

        address recipient = owner();
        emit FundsWithdrawn(recipient, balance);

        (bool success, ) = payable(recipient).call{value: balance}("");
        if (!success) revert WithdrawFailed();
    }

    /**
     * @notice Updates the metadata URI for token types.
     * @param newUri New URI string
     */
    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
        emit UriUpdated(newUri);
    }

    // --- Public / Buyer Functions ---

    /**
     * @notice Purchases ticket(s) in a tier with exact native currency payment.
     * @param id Tier ID to purchase
     * @param amount Number of tickets to purchase
     */
    function buy(uint256 id, uint256 amount) external payable nonReentrant {
        if (amount == 0) revert ZeroAmount();

        Tier storage tier = tiers[id];
        if (!tier.exists) revert TierDoesNotExist(id);
        if (!tier.active) revert TierNotActive(id);

        uint256 currentSupply = totalSupply(id);
        if (currentSupply + amount > tier.maxSupply) {
            revert MaxSupplyExceeded(id, amount, tier.maxSupply - currentSupply);
        }

        uint256 expectedPayment = tier.price * amount;
        if (msg.value != expectedPayment) {
            revert ExactPaymentRequired(expectedPayment, msg.value);
        }

        emit TicketsPurchased(msg.sender, id, amount, msg.value);

        _mint(msg.sender, id, amount, "");
    }

    // --- View Functions ---

    /**
     * @notice Returns the remaining available tickets for a tier.
     * @param id Tier ID
     */
    function remaining(uint256 id) public view returns (uint256) {
        if (!tiers[id].exists) revert TierDoesNotExist(id);
        return tiers[id].maxSupply - totalSupply(id);
    }

    /**
     * @notice Returns comprehensive details for a tier.
     * @param id Tier ID
     */
    function tierInfo(uint256 id)
        external
        view
        returns (
            string memory tierName,
            uint256 maxSupply,
            uint256 price,
            uint256 currentSupply,
            uint256 remainingSupply,
            bool active,
            bool exists
        )
    {
        Tier storage t = tiers[id];
        if (!t.exists) revert TierDoesNotExist(id);
        return (
            t.name,
            t.maxSupply,
            t.price,
            totalSupply(id),
            t.maxSupply - totalSupply(id),
            t.active,
            t.exists
        );
    }

    /**
     * @notice Returns all created tier IDs.
     */
    function getTierIds() external view returns (uint256[] memory) {
        return tierIds;
    }

    /**
     * @notice Returns the count of created tiers.
     */
    function totalTiers() external view returns (uint256) {
        return tierIds.length;
    }

    // --- Overrides ---

    /**
     * @dev Hook that is called before any token transfer, including minting and burning.
     * Required by OpenZeppelin v5 ERC1155Supply.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
