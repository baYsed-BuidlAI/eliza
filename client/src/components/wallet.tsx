import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LogOut } from "lucide-react";
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
        } catch (error) {
            console.error("Failed to update wallet info:", error);
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
            } catch (error) {
                console.error("Failed to connect wallet:", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    }

    function disconnectWallet() {
        setConnected(false);
        setAddress(null);
        setBalance(null);
        setNetwork(null);
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

    // Add network change and account change event listeners
    useEffect(() => {
        if (window.ethereum && connected) {
            // Network change event
            const handleChainChanged = (chainId: string) => {
                // Refresh page
                window.location.reload();
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
