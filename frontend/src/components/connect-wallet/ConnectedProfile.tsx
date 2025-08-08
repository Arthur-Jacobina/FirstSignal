import { ChevronDown } from 'lucide-react'
import { Button } from '../Button'
import { DropdownMenu } from './DropdownMenu'
import { getPP } from './utils'

interface ConnectedProfileProps {
  address: string | undefined
  dropdownOpen: boolean
  setDropdownOpen: (open: boolean) => void
}

export function ConnectedProfile({ 
  address, 
  dropdownOpen, 
  setDropdownOpen 
}: ConnectedProfileProps) {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        variant="outline"
        radius="xl"
        size="sm"
        className="flex items-center space-x-2"
      >
        <div className="w-6 h-6 rounded-full">
          <img 
            src={getPP(address)} 
            alt="Profile" 
            className="w-6 h-6 object-cover" 
          />
        </div>        
        <span className="hidden sm:inline text-xs font-medium">
          {address ? formatAddress(address) : ''}
        </span>
        
        <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      <DropdownMenu 
        address={address}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        formatAddress={formatAddress}
      />
    </div>
  )
} 