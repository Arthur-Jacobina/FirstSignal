import { useConnect } from 'wagmi'
import { Button } from '../Button'
import { Wallet } from 'lucide-react'


export function ConnectButton() {
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
      className="flex items-center space-x-2"
    >
      <Wallet className="h-4 w-4" />
      <span className="text-sm font-medium">
        {isPending ? "Connecting..." : "Connect"}
      </span>
    </Button>
  )
} 