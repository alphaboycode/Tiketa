// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Tiketa} from "../src/Tiketa.sol";

contract DeployScript is Script {
    address constant DEPLOYER = 0x732B93b3CAf885aD468A53778d0781de4D361b64;

    function run() external returns (Tiketa tiketa) {
        vm.startBroadcast();

        console.log("Deploying Tiketa from account:", deployer);

        // Deploy Tiketa contract with deployer as initial owner
        tiketa = new Tiketa(deployer, "https://api.tiketa.xyz/metadata/{id}.json");
        console.log("Tiketa deployed at:", address(tiketa));

        // Create Default Tier 1: GA (General Admission, id 1, cap 500, price 0.01 BOT)
        tiketa.createTier(1, "General Admission", 500, 0.01 ether);
        console.log("Tier 1 created: General Admission (Cap: 500, Price: 0.01 BOT)");

        // Create Default Tier 2: VIP (id 2, cap 50, price 0.05 BOT)
        tiketa.createTier(2, "VIP", 50, 0.05 ether);
        console.log("Tier 2 created: VIP (Cap: 50, Price: 0.05 BOT)");

        vm.stopBroadcast();
    }
}
