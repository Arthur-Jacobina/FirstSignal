import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from './ConnectButton'
import { ConnectedProfile } from './ConnectedProfile'

export function ConnectWallet() {
  const { isConnected, address } = useAccount()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  if (isConnected) {
    return (
      <ConnectedProfile 
        address={address} 
        dropdownOpen={dropdownOpen} 
        setDropdownOpen={setDropdownOpen} 
      />
    )
  }
  
  return <ConnectButton />
} 