import React, { useState } from 'react'
import { 
  useAccount, 
  useConnect, 
  useDisconnect 
} from 'wagmi'
import { Button } from './Button'
import { 
  Wallet, 
  LogOut, 
  Settings, 
  ChevronDown,
  Copy,
  ExternalLink 
} from 'lucide-react'

// Function to get a Pokemon profile picture based on user address
function getPP(address?: string): string {
  if (!address) {
    // Default random Pokemon if no address
    const randomId = Math.floor(Math.random() * 151) + 1
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`
  }
  
  // Use address as seed to ensure same user gets same Pokemon
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Get Pokemon ID between 1-151 (original Pokemon)
  const pokemonId = Math.abs(hash % 151) + 1
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
}

export default function ConnectWallet() {
  const { isConnected, address } = useAccount()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  if (isConnected) {
    return <ConnectedProfile address={address} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} />
  }
  
  return <ConnectButton />
}

function ConnectButton() {
  const { connectors, connect, isPending } = useConnect()
  
  const connector = connectors.find(
    (connector) => connector.id === 'xyz.ithaca.porto',
  )

  const handleConnect = () => {
    if (connector) {
      connect({
        connector,
        // @ts-ignore - Porto specific option  
        signInWithEthereum: {
          authUrl: '/api/siwe',
        },
      })
    }
  }

  return (
    <Button
      onClick={handleConnect}
      variant="primary"
      radius="xl"
      size="sm"
      disabled={isPending}
      className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4"
    >
      <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="text-xs sm:text-sm font-medium">
        {isPending ? "Connecting..." : "Connect"}
      </span>
    </Button>
  )
}

function ConnectedProfile({ 
  address, 
  dropdownOpen, 
  setDropdownOpen 
}: { 
  address: string | undefined
  dropdownOpen: boolean
  setDropdownOpen: (open: boolean) => void
}) {
  const { disconnect } = useDisconnect()
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        variant="outline"
        radius="xl"
        size="sm"
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 hover:bg-[hsl(var(--accent))] border-0 bg-transparent"
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center overflow-hidden">
          <img src={getPP(address)} alt="Pokemon Profile" className="w-full h-full object-cover rounded-full" />
        </div>        
        <span className="hidden sm:inline text-xs font-medium">
          {address ? formatAddress(address) : ''}
        </span>
        
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Profile Header */}
            <div className="p-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img src={getPP(address)} alt="Pokemon Profile" className="w-full h-full object-cover rounded-full" />
                </div>      
                <div className="flex-1 min-w-0">
                  <p className="text-[hsl(var(--muted-foreground))] truncate">
                    {address ? formatAddress(address) : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={copyAddress}
                className="flex items-center w-full px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Copy className="h-4 w-4 mr-3" />
                Copy Address
              </button>
              
              <button
                onClick={() => window.open(`https://sepolia.basescan.org/address/${address}`, '_blank')}
                className="flex items-center w-full px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-3" />
                View on Explorer
              </button>
              
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
              
              <div className="border-t border-[hsl(var(--border))] my-1" />
              
              <button
                onClick={() => {
                  disconnect()
                  setDropdownOpen(false)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
