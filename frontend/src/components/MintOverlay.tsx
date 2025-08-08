import { useState, useEffect } from 'react'
import { 
    type BaseError,
    useAccount, 
    useSendCalls,
    useWaitForCallsStatus,
    useChainId, 
    useSwitchChain 
} from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { parseEther } from 'viem'
import { useThemeContext } from '@/context/ThemeContext'
import { 
    CardHeader, 
    CardTitle, 
    CardContent, 
    CardFooter 
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MagicCard } from '@/components/magicui/magic-card'
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card'
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button'
import { ComicText } from '@/components/magicui/comic-text'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { exp1Config } from '@/lib/contracts'

interface MintOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function MintOverlay({ isOpen, onClose }: MintOverlayProps) {
  const { theme } = useThemeContext()
  const { isConnected, address } = useAccount()
  const { data, isPending, sendCalls, error } = useSendCalls()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForCallsStatus({
    id: data?.id,
  })
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  
  const [mintAmount, setMintAmount] = useState('')
  const [mintError, setMintError] = useState<string | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState<string | null>(null)

  useEffect(() => {
    const handleTransactionSuccess = async () => {
      if (isConfirmed && data?.id && isMinting) {
        try {
          console.log('Mint transaction confirmed:', data.id)
          setMintSuccess('EXP tokens minted successfully!')
          setMintAmount('')
          setIsMinting(false)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setMintError(message)
          setIsMinting(false)
        }
      }
    }

    handleTransactionSuccess()
  }, [isConfirmed, data?.id, isMinting])

  useEffect(() => {
    if (error && isMinting) {
      const message = (error as BaseError).shortMessage || error.message
      setMintError(message)
      setIsMinting(false)
    }
  }, [error, isMinting])

  const handleMintAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMintAmount(value)
    
    // Clear success/error messages when user starts typing again
    if (mintSuccess) {
      setMintSuccess(null)
    }
    if (mintError) {
      setMintError(null)
    }
  }

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()

    setMintError(null)
    setMintSuccess(null)

    if (!mintAmount || isNaN(Number(mintAmount)) || Number(mintAmount) <= 0) {
      setMintError('Please enter a valid mint amount.')
      return
    }

    if (!isConnected) {
      setMintError('Please connect your wallet to mint tokens.')
      return
    }

    if (!address) {
      setMintError('Wallet address not available.')
      return
    }

    try {
      setIsMinting(true)
      
      if (chainId !== baseSepolia.id) {
        await switchChainAsync({ chainId: baseSepolia.id })
      }

      sendCalls({
        calls: [
          {
            abi: exp1Config.abi,
            args: [address, parseEther(mintAmount)],
            functionName: 'mint',
            to: exp1Config.address,
          },
        ],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setMintError(message)
      setIsMinting(false)
    }
  }

  const handleClose = () => {
    // Reset form state when closing
    setMintAmount('')
    setMintError(null)
    setMintSuccess(null)
    setIsMinting(false)
    onClose()
  }

  const isMintButtonDisabled = isMinting || isPending || isConfirming || !mintAmount.trim() || 
    !isConnected || isSwitching || isNaN(Number(mintAmount)) || Number(mintAmount) <= 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <NeonGradientCard 
          className="p-0 bg-card w-full shadow-xl border-1 border-border" 
          neonColors={{
            firstColor: theme === "dark" ? "hsl(var(--secondary))" : "hsl(var(--secondary))",
            secondColor: theme === "dark" ? "hsl(var(--secondary))" : "hsl(var(--secondary))"
          }} 
          borderSize={1} 
          opacity={0.9}
        >
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--secondary))" : "hsl(var(--secondary))"}
            className="p-0"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            {/* Header with close button */}
            <CardHeader className="border-b border-border p-4 [.border-b]:pb-4 relative">
              <CardTitle>
                <ComicText fontSize={3} style={{ color: "#ffffff" }}>
                  Mint EXP
                </ComicText>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={handleMint}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mintAmount">
                      <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                        Amount to Mint
                      </SparklesText>
                    </Label>
                    <Input 
                      id="mintAmount" 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10"
                      value={mintAmount}
                      onChange={handleMintAmountChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="p-4 justify-center border-t border-border [.border-t]:pt-4">
              <div className="flex flex-col items-center gap-4 w-full">
                <InteractiveHoverButton 
                  className="w-full" 
                  disabled={isMintButtonDisabled}
                  onClick={handleMint}
                  type="submit"
                >
                  <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                    {isMinting && isPending ? 'Minting...' : isConfirming && isMinting ? 'Confirming...' : 'Mint EXP'}
                  </SparklesText>
                </InteractiveHoverButton>
                
                {data?.id && isMinting && (
                  <div className="text-sm text-muted-foreground text-center">
                    Transaction ID: {data.id.slice(0, 10)}...{data.id.slice(-8)}
                  </div>
                )}
                
                {isConfirming && isMinting && (
                  <div className="text-sm text-muted-foreground text-center">
                    Waiting for confirmation...
                  </div>
                )}
                
                {mintError && (
                  <div className="text-sm text-red-500 text-center">
                    Error: {mintError}
                  </div>
                )}
                
                {mintSuccess && (
                  <div className="text-sm text-green-500 text-center">
                    {mintSuccess}
                  </div>
                )}
              </div>
            </CardFooter>
          </MagicCard>
        </NeonGradientCard>
      </div>
    </div>
  )
} 