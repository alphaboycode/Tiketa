// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Tiketa} from "../src/Tiketa.sol";

contract DeployScript is Script {
    address constant DEPLOYER = 0x732B93b3CAf885aD468A53778d0781de4D361b64;

    function run() external returns (Tiketa tiketa) {
        vm.startBroadcast();

        address deployer = msg.sender;
        console.log("Deploying Tiketa from account:", deployer);

        // Deploy Tiketa contract with deployer as initial owner
        tiketa = new Tiketa(deployer, "https://api.tiketa.xyz/metadata/{id}.json");
        console.log("Tiketa deployed at:", address(tiketa));

        // Create Default Tier 1: Botchain Global Summit 2026 (id 1, cap 500, price 0.001 BOT)
        tiketa.createTier(1, "Botchain Global Summit 2026", 500, 0.001 ether);
        console.log("Tier 1 created: Botchain Global Summit 2026 (Cap: 500, Price: 0.001 BOT)");

        // Create Default Tier 2: AI & Web3 Hackathon (id 2, cap 250, price 0.002 BOT)
        tiketa.createTier(2, "AI & Web3 Hackathon", 250, 0.002 ether);
        console.log("Tier 2 created: AI & Web3 Hackathon (Cap: 250, Price: 0.002 BOT)");

        // Create Default Tier 3: VIP Networking Gala (id 3, cap 100, price 0.005 BOT)
        tiketa.createTier(3, "VIP Networking Gala", 100, 0.005 ether);
        console.log("Tier 3 created: VIP Networking Gala (Cap: 100, Price: 0.005 BOT)");

        vm.stopBroadcast();
    }
}
