import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, formatEther, parseEther } from 'ethers';
import { TIKETA_ABI, TIKETA_ADDRESS, BOTCHAIN_NETWORK, BOTCHAIN_CHAIN_ID } from '../contracts';
import { TierData, UserTicket, TxState } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useTiketa() {
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return localStorage.getItem('tiketa_contract_override') || TIKETA_ADDRESS;
  });

  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const [tiers, setTiers] = useState<TierData[]>([]);
  const [myTickets, setMyTickets] = useState<UserTicket[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState<boolean>(false);

  const [txState, setTxState] = useState<TxState>({ status: 'idle' });

  // Read-only fallback provider connected to Botchain testnet RPC
  const readOnlyProvider = useMemo(() => {
    return new JsonRpcProvider(BOTCHAIN_NETWORK.rpcUrls[0], {
      chainId: BOTCHAIN_CHAIN_ID,
      name: BOTCHAIN_NETWORK.chainName,
    });
  }, []);

  // Update contract address override
  const updateContractAddress = (newAddr: string) => {
    setContractAddress(newAddr);
    localStorage.setItem('tiketa_contract_override', newAddr);
  };

  // Switch or Add Botchain testnet
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error('No crypto wallet detected');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BOTCHAIN_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates chain hasn't been added yet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BOTCHAIN_NETWORK],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask or compatible Web3 wallet not detected. Please install a wallet to continue.');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      if (currentChainId !== BOTCHAIN_CHAIN_ID) {
        try {
          await switchNetwork();
        } catch (err: any) {
          console.error('Failed to switch network:', err);
        }
      }

      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const bal = await provider.getBalance(accounts[0]);
        setBalance(formatEther(bal));
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [switchNetwork]);

  const disconnectWallet = () => {
    setAccount(null);
    setIsOwner(false);
    setMyTickets([]);
  };

  // Helper to get active provider & contract instance
  const getContractInstance = useCallback(
    async (withSigner = false) => {
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(contractAddress) && contractAddress !== '0x0000000000000000000000000000000000000000';
      if (!isValidAddress) return null;

      if (withSigner && window.ethereum && account) {
        const browserProvider = new BrowserProvider(window.ethereum);
        const signer = await browserProvider.getSigner();
        return new Contract(contractAddress, TIKETA_ABI, signer);
      }

      return new Contract(contractAddress, TIKETA_ABI, readOnlyProvider);
    },
    [contractAddress, account, readOnlyProvider]
  );

  // Fetch contract data (tiers, owner, contract balance)
  const refreshData = useCallback(async () => {
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(contractAddress) && contractAddress !== '0x0000000000000000000000000000000000000000';
    if (!isValidAddress) {
      setTiers([]);
      setMyTickets([]);
      return;
    }

    setIsLoadingTiers(true);
    try {
      const contract = await getContractInstance(false);
      if (!contract) return;

      // 1. Fetch Owner
      try {
        const ownerAddr = await contract.owner();
        setContractOwner(ownerAddr);
        if (account) {
          setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
        }
      } catch (e) {
        console.warn('Could not fetch contract owner:', e);
      }

      // 2. Fetch contract balance
      try {
        const bal = await readOnlyProvider.getBalance(contractAddress);
        setContractBalance(formatEther(bal));
      } catch (e) {
        console.warn('Could not fetch contract balance:', e);
      }

      // 3. Fetch user native balance if connected
      if (account) {
        try {
          const bal = await readOnlyProvider.getBalance(account);
          setBalance(formatEther(bal));
        } catch (e) {}
      }

      // 4. Fetch Tier IDs & details
      let ids: bigint[] = [];
      try {
        ids = await contract.getTierIds();
      } catch (e) {
        // Fallback for default IDs 1 and 2 if getTierIds failed
        ids = [1n, 2n];
      }

      const fetchedTiers: TierData[] = [];
      const userTickets: UserTicket[] = [];

      for (const rawId of ids) {
        const idNum = Number(rawId);
        try {
          const info = await contract.tierInfo(rawId);
          // tierInfo returns: (string name, uint256 maxSupply, uint256 price, uint256 currentSupply, uint256 remainingSupply, bool active, bool exists)
          const tierItem: TierData = {
            id: idNum,
            name: info[0],
            maxSupply: BigInt(info[1]),
            price: BigInt(info[2]),
            priceFormatted: formatEther(info[2]),
            currentSupply: BigInt(info[3]),
            remainingSupply: BigInt(info[4]),
            active: info[5],
            exists: info[6],
          };
          fetchedTiers.push(tierItem);

          // Check user balance for this tier
          if (account) {
            try {
              const userBal = await contract.balanceOf(account, rawId);
              if (userBal > 0n) {
                userTickets.push({
                  tierId: idNum,
                  name: info[0],
                  quantity: BigInt(userBal),
                  priceFormatted: formatEther(info[2]),
                });
              }
            } catch (balErr) {
              console.warn(`Error getting balance for tier ${idNum}:`, balErr);
            }
          }
        } catch (tierErr) {
          console.warn(`Error fetching info for tier ${idNum}:`, tierErr);
        }
      }

      // Sort tiers by ID
      fetchedTiers.sort((a, b) => a.id - b.id);
      setTiers(fetchedTiers);
      setMyTickets(userTickets);
    } catch (err) {
      console.error('Error refreshing Tiketa data:', err);
    } finally {
      setIsLoadingTiers(false);
    }
  }, [contractAddress, account, getContractInstance, readOnlyProvider]);

  // Initial load and listeners
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Initial silent check
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      })
      .catch(() => {});

    window.ethereum
      .request({ method: 'eth_chainId' })
      .then((cid: string) => {
        setChainId(parseInt(cid, 16));
      })
      .catch(() => {});

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Update isOwner when account or contractOwner changes
  useEffect(() => {
    if (account && contractOwner) {
      setIsOwner(account.toLowerCase() === contractOwner.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [account, contractOwner]);

  // --- Actions ---

  // Buy Tickets
  const buyTickets = async (tierId: number, amount: number, totalCostWei: bigint) => {
    if (!account) throw new Error('Please connect your wallet first');
    if (chainId !== BOTCHAIN_CHAIN_ID) {
      await switchNetwork();
    }

    const contract = await getContractInstance(true);
    if (!contract) throw new Error('Contract not configured');

    setTxState({ status: 'pending', action: `Purchasing ${amount} ticket(s)...` });

    try {
      const tx = await contract.buy(tierId, amount, { value: totalCostWei });
      setTxState({
        status: 'pending',
        hash: tx.hash,
        action: 'Waiting for Botchain confirmation...',
      });

      const receipt = await tx.wait();
      setTxState({
        status: 'success',
        hash: tx.hash,
        message: `Successfully purchased ${amount} ticket(s)! Block: ${receipt.blockNumber}`,
      });

      await refreshData();
      return tx.hash;
    } catch (err: any) {
      const message = err.reason || err.shortMessage || err.message || 'Transaction failed';
      setTxState({ status: 'error', message });
      throw err;
    }
  };

  // Organizer: Create Tier
  const createTier = async (id: number, name: string, maxSupply: number, priceBOT: string) => {
    if (!account) throw new Error('Please connect your wallet');
    const contract = await getContractInstance(true);
    if (!contract) throw new Error('Contract not configured');

    const priceWei = parseEther(priceBOT);
    setTxState({ status: 'pending', action: `Creating tier "${name}" (ID ${id})...` });

    try {
      const tx = await contract.createTier(id, name, maxSupply, priceWei);
      setTxState({
        status: 'pending',
        hash: tx.hash,
        action: 'Submitting tier creation to Botchain...',
      });

      await tx.wait();
      setTxState({
        status: 'success',
        hash: tx.hash,
        message: `Tier "${name}" created successfully!`,
      });

      await refreshData();
    } catch (err: any) {
      const message = err.reason || err.shortMessage || err.message || 'Failed to create tier';
      setTxState({ status: 'error', message });
      throw err;
    }
  };

  // Organizer: Set Price
  const setTierPrice = async (id: number, newPriceBOT: string) => {
    if (!account) throw new Error('Please connect your wallet');
    const contract = await getContractInstance(true);
    if (!contract) throw new Error('Contract not configured');

    const newPriceWei = parseEther(newPriceBOT);
    setTxState({ status: 'pending', action: `Updating price for tier ${id}...` });

    try {
      const tx = await contract.setPrice(id, newPriceWei);
      setTxState({
        status: 'pending',
        hash: tx.hash,
        action: 'Updating price on-chain...',
      });

      await tx.wait();
      setTxState({
        status: 'success',
        hash: tx.hash,
        message: `Tier ${id} price updated to ${newPriceBOT} BOT!`,
      });

      await refreshData();
    } catch (err: any) {
      const message = err.reason || err.shortMessage || err.message || 'Failed to update price';
      setTxState({ status: 'error', message });
      throw err;
    }
  };

  // Organizer: Set Tier Active
  const setTierActive = async (id: number, active: boolean) => {
    if (!account) throw new Error('Please connect your wallet');
    const contract = await getContractInstance(true);
    if (!contract) throw new Error('Contract not configured');

    setTxState({
      status: 'pending',
      action: `${active ? 'Activating' : 'Pausing'} sales for tier ${id}...`,
    });

    try {
      const tx = await contract.setTierActive(id, active);
      setTxState({
        status: 'pending',
        hash: tx.hash,
        action: 'Updating tier status on Botchain...',
      });

      await tx.wait();
      setTxState({
        status: 'success',
        hash: tx.hash,
        message: `Tier ${id} is now ${active ? 'Active' : 'Paused'}.`,
      });

      await refreshData();
    } catch (err: any) {
      const message = err.reason || err.shortMessage || err.message || 'Failed to update tier status';
      setTxState({ status: 'error', message });
      throw err;
    }
  };

  // Organizer: Withdraw Proceeds
  const withdrawFunds = async () => {
    if (!account) throw new Error('Please connect your wallet');
    const contract = await getContractInstance(true);
    if (!contract) throw new Error('Contract not configured');

    setTxState({ status: 'pending', action: 'Withdrawing ticket sale proceeds...' });

    try {
      const tx = await contract.withdraw();
      setTxState({
        status: 'pending',
        hash: tx.hash,
        action: 'Processing withdrawal transaction...',
      });

      await tx.wait();
      setTxState({
        status: 'success',
        hash: tx.hash,
        message: `Proceeds successfully withdrawn to organizer wallet!`,
      });

      await refreshData();
    } catch (err: any) {
      const message = err.reason || err.shortMessage || err.message || 'Withdrawal failed';
      setTxState({ status: 'error', message });
      throw err;
    }
  };

  // User: Transfer Ticket (ERC-1155 safeTransferFrom)
  const transferTicket = async (to: string, tierId: number, amount: number) => {
    if (!account) throw new Error('Please connect your wallet');
    const contract = await getContractInstance(true);
    if (!contract) throw new Error('Contract not configured');

    setTxState({ status: 'pending', action: `Transferring ${amount} ticket(s) to ${to}...` });

    try {
      const tx = await contract.safeTransferFrom(account, to, tierId, amount, '0x');
      setTxState({
        status: 'pending',
        hash: tx.hash,
        action: 'Transferring ticket on-chain...',
      });

      await tx.wait();
      setTxState({
        status: 'success',
        hash: tx.hash,
        message: `Successfully transferred ${amount} ticket(s) to ${to}!`,
      });

      await refreshData();
    } catch (err: any) {
      const message = err.reason || err.shortMessage || err.message || 'Transfer failed';
      setTxState({ status: 'error', message });
      throw err;
    }
  };

  const clearTxState = () => setTxState({ status: 'idle' });

  return {
    contractAddress,
    updateContractAddress,
    account,
    chainId,
    isBotchain: chainId === BOTCHAIN_CHAIN_ID,
    balance,
    contractBalance,
    contractOwner,
    isOwner,
    isConnecting,
    tiers,
    myTickets,
    isLoadingTiers,
    txState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshData,
    buyTickets,
    createTier,
    setTierPrice,
    setTierActive,
    withdrawFunds,
    transferTicket,
    clearTxState,
  };
}
