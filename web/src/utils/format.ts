import { formatEther } from 'ethers';

export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatBOT(wei: bigint): string {
  try {
    const etherStr = formatEther(wei);
    // Trim trailing zeroes after decimal point if present
    const parsed = parseFloat(etherStr);
    if (parsed === 0) return '0';
    if (parsed < 0.0001) return '<0.0001';
    return etherStr.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  } catch {
    return '0';
  }
}

export function getExplorerTxUrl(hash: string): string {
  return `https://scan.bohr.life/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `https://scan.bohr.life/address/${address}`;
}
