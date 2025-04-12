import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LogOut, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Wallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [network, setNetwork] = useState<string | null>(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

    // Ethereum Mainnet chain ID
    const ETHEREUM_CHAIN_ID = "0x1"; // 1 in decimal

    async function getNetworkName(chainId: string) {
        const chainIdNum = parseInt(chainId, 16);
        const networks: Record<number, string> = {
            1: "Ethereum",
            5: "Goerli",
            11155111: "Sepolia",
            137: "Polygon",
            80001: "Mumbai",
            56: "Binance Smart Chain",
            97: "BSC Testnet",
            43114: "Avalanche",
            42161: "Arbitrum",
            10: "Optimism",
        };
        return networks[chainIdNum] || `Chain ID: ${chainIdNum}`;
    }

    async function updateWalletInfo(addr: string) {
        try {
            // Get ETH balance
            const balanceHex = await window.ethereum!.request({
                method: "eth_getBalance",
                params: [addr, "latest"],
            });

            // Convert hex to decimal and display in ETH units (wei -> ether)
            const balanceInWei = parseInt(balanceHex, 16);
            const balanceInEth = balanceInWei / 1e18;
            setBalance(balanceInEth.toFixed(4));

            // Get network information
            const chainId = await window.ethereum!.request({
                method: "eth_chainId",
            });
            const networkName = await getNetworkName(chainId);
            setNetwork(networkName);

            // Check if on Ethereum Mainnet
            setIsCorrectNetwork(chainId === ETHEREUM_CHAIN_ID);
        } catch (error) {
            console.error("Failed to update wallet info:", error);
        }
    }

    async function switchToEthereum() {
        try {
            await window.ethereum!.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: ETHEREUM_CHAIN_ID }],
            });
        } catch (error: any) {
            console.error("Failed to switch network:", error);
            if (error.code === 4902) {
                // Chain not added, suggest adding it
                alert("Please add the Ethereum network to MetaMask.");
            }
        }
    }

    async function connectWallet() {
        if (window.ethereum) {
            try {
                // Request MetaMask connection
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                const addr = accounts[0];
                setAddress(addr);
                await updateWalletInfo(addr);
                setConnected(true);

                // Save connection state to localStorage
                localStorage.setItem("walletConnected", "true");
                localStorage.setItem("walletAddress", addr);
            } catch (error) {
                console.error("Failed to connect wallet:", error);
            }
        } else {
            // Redirect to MetaMask download page
            if (
                confirm(
                    "MetaMask is not installed. Would you like to download it now?"
                )
            ) {
                window.open("https://metamask.io/download/", "_blank");
            }
        }
    }

    function disconnectWallet() {
        setConnected(false);
        setAddress(null);
        setBalance(null);
        setNetwork(null);
        setIsCorrectNetwork(true);

        // Clear localStorage
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("walletAddress");
    }

    function copyAddress() {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function truncateAddress(addr: string) {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    }

    // Initialize connection from localStorage if available
    useEffect(() => {
        const isConnected = localStorage.getItem("walletConnected") === "true";
        const savedAddress = localStorage.getItem("walletAddress");

        if (isConnected && savedAddress && window.ethereum) {
            setAddress(savedAddress);
            setConnected(true);
            updateWalletInfo(savedAddress);
        }
    }, []);

    // Add network change and account change event listeners
    useEffect(() => {
        if (window.ethereum && connected) {
            // Network change event
            const handleChainChanged = (chainId: string) => {
                updateWalletInfo(address!);
            };

            // Account change event
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    // Disconnect account
                    disconnectWallet();
                } else if (accounts[0] !== address) {
                    // Change to different account
                    setAddress(accounts[0]);
                    updateWalletInfo(accounts[0]);
                    localStorage.setItem("walletAddress", accounts[0]);
                }
            };

            window.ethereum.on("chainChanged", handleChainChanged);
            window.ethereum.on("accountsChanged", handleAccountsChanged);

            // Remove event listeners on component unmount
            return () => {
                window.ethereum?.removeListener(
                    "chainChanged",
                    handleChainChanged
                );
                window.ethereum?.removeListener(
                    "accountsChanged",
                    handleAccountsChanged
                );
            };
        }
    }, [connected, address]);

    return (
        <div className="flex items-center">
            {connected && address ? (
                <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {truncateAddress(address)}
                            </span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={copyAddress}
                                        >
                                            <Copy size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            {copied ? "Copied" : "Copy Address"}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                window.open(
                                                    `https://etherscan.io/address/${address}`,
                                                    "_blank"
                                                )
                                            }
                                        >
                                            <ExternalLink size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>View on Etherscan</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={disconnectWallet}
                                        >
                                            <LogOut size={14} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Disconnect</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {network && <span>Network: {network} | </span>}
                            Balance: {balance} ETH
                        </span>

                        {!isCorrectNetwork && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-yellow-500">
                                <AlertTriangle size={12} />
                                <button
                                    className="underline hover:text-yellow-600"
                                    onClick={switchToEthereum}
                                >
                                    Switch to Ethereum Mainnet
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={connectWallet}
                    className={cn("text-xs", "px-2 py-1 h-8")}
                >
                    Connect Wallet
                </Button>
            )}
        </div>
    );
}

// MetaMask type extension
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (
                event: string,
                callback: (...args: any[]) => void
            ) => void;
        };
    }
}
