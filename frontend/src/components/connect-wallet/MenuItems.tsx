import { Copy, ExternalLink, Settings, LogOut } from 'lucide-react'
import { useDisconnect } from 'wagmi'

interface MenuItemsProps {
  address: string | undefined
  setDropdownOpen: (open: boolean) => void
}

export function MenuItems({ address, setDropdownOpen }: MenuItemsProps) {
  const { disconnect } = useDisconnect()

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setDropdownOpen(false)
  }

  return (
    <div className="py-1">
      <button
        onClick={copyAddress}
        className="flex items-center w-full px-3 py-2 text-sm"
      >
        <Copy className="h-4 w-4 mr-3" />
        Copy Address
      </button>
      
      <button
        onClick={() => window.open(`https://sepolia.basescan.org/address/${address}`, '_blank')}
        className="flex items-center w-full px-3 py-2 text-sm"
      >
        <ExternalLink className="h-4 w-4 mr-3" />
        View on Explorer
      </button>
      
      <button className="flex items-center w-full px-3 py-2 text-sm">
        <Settings className="h-4 w-4 mr-3" />
        Settings
      </button>
      
      <div className="border-t border-border my-1" />
      
      <button
        onClick={handleDisconnect}
        className="flex items-center w-full px-3 py-2 text-sm text-red-500"
      >
        <LogOut className="h-4 w-4 mr-3" />
        Disconnect
      </button>
    </div>
  )
} 