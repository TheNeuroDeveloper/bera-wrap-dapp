import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

const wberaAddress = "0x6969696969696969696969696969696969696969";
const wberaAbi = [
  "function deposit() public payable",
  "function withdraw(uint256 amount) public",
  "function balanceOf(address owner) view returns (uint256)"
];

export default function WrapBERA() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isClient, setIsClient] = useState(false); // Ensure client-side rendering

  useEffect(() => {
    setIsClient(true); // Marks that we're now on the client
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
    }
  }, [isClient]);

  const connectWallet = async () => {
    if (!provider) return alert("MetaMask not detected");
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    const signer = await provider.getSigner();
    setSigner(signer);
    const contractInstance = new ethers.Contract(wberaAddress, wberaAbi, signer);
    setContract(contractInstance);
    updateBalance(accounts[0], contractInstance);
  };

  const updateBalance = async (wallet: string, contractInstance: ethers.Contract) => {
    if (contractInstance) {
      const bal = await contractInstance.balanceOf(wallet);
      setBalance(ethers.formatEther(bal)); // Updated to ethers.formatEther
    }
  };

  const wrapBERA = async () => {
    if (!contract) return alert("Connect Wallet First");
    const tx = await contract.deposit({ value: ethers.parseEther("1") }); // Updated to ethers.parseEther
    await tx.wait();
    alert("Wrapped 1 BERA to WBERA");
    updateBalance(account!, contract);
  };

  const unwrapBERA = async () => {
    if (!contract) return alert("Connect Wallet First");
    const tx = await contract.withdraw(ethers.parseEther("1")); // Updated to ethers.parseEther
    await tx.wait();
    alert("Unwrapped 1 WBERA to BERA");
    updateBalance(account!, contract);
  };

  if (!isClient) {
    return null; // Prevent hydration mismatch by not rendering on the server
  }

  return (
    <div className="p-6 flex flex-col items-center space-y-4">
      <h1 className="text-xl font-bold">BERA to WBERA DApp</h1>
      <Button onClick={connectWallet}>
        {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
      </Button>
      <p>Your WBERA Balance: {balance} WBERA</p>
      <div className="flex space-x-4">
        <Button onClick={wrapBERA} className="bg-blue-500 text-white">Wrap 1 BERA</Button>
        <Button onClick={unwrapBERA} className="bg-red-500 text-white">Unwrap 1 WBERA</Button>
      </div>
    </div>
  );
}