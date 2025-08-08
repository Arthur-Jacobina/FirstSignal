import { Bitcoin } from 'lucide-react'
import { PulsatingButton } from './magicui/pulsating-button'

interface FloatingMintButtonProps {
  onClick: () => void
}

export function FloatingMintButton({ onClick }: FloatingMintButtonProps) {

  return (
    <div className="fixed z-40">
        <PulsatingButton 
          className="w-14 h-14 rounded-full items-center justify-center bg-primary/40 hover:bg-primary/50"
          onClick={onClick}
          pulseColor="hsl(var(--primary))"
        >
          <Bitcoin className="h-6 w-6 text-foreground font-bold" />
        </PulsatingButton>
    </div>
  )
} 