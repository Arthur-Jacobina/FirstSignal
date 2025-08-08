import { createFileRoute } from '@tanstack/react-router'
import { useThemeContext } from '@/context/ThemeContext'
import { MagicCard } from '@/components/magicui/magic-card'
import { WarpBackground } from '@/components/magicui/warp-background'
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card'
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button'
import { ComicText } from '@/components/magicui/comic-text'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { FloatingMintButton } from '@/components/FloatingMintButton'
import { MintOverlay } from '@/components/MintOverlay'
import { useState } from 'react'

export const Route = createFileRoute('/landingpage')({
  component: RouteComponent,
})

function RouteComponent() {
  const { theme } = useThemeContext()
  const [isMintOverlayOpen, setIsMintOverlayOpen] = useState(false)

  const heroContent = (
    <div className="min-w-md p-8 flex justify-center items-center flex-row">
      <div className="max-w-4xl min-w-md p-0 space-y-8 w-full md:w-auto h-full">
        {/* Hero Section */}
        <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
          firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
          secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
        }} borderSize={1} opacity={0.9}>
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            className="p-4"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            <div className="text-center p-6">
              <ComicText fontSize={3} style={{ color: "#ffffff" }} className="mb-6">
                ❤️ First Signal
              </ComicText>
              <SparklesText className="text-foreground text-2xl font-semibold mb-4" sparklesCount={5}>
                Let the Agent Say What You Can't
              </SparklesText>
              <div className="text-lg text-muted-foreground max-w-2xl mx-auto space-y-2">
                <p>We've all been there — heart racing, words stuck.</p>
                <p>First Signal is your discreet, on-chain messenger for secret crushes.</p>
                <p>You tell us. We deliver.</p>
                <p>No awkwardness, no pressure — just a chance.</p>
              </div>
            </div>
          </MagicCard>
        </NeonGradientCard>

        {/* How It Works Section */}
        <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
          firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
          secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
        }} borderSize={1} opacity={0.9}>
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            className="p-4"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            <div className="text-center p-6">
              <ComicText fontSize={3} style={{ color: "#ffffff" }} className="mb-6">
                How It Works
              </ComicText>
              <div className="space-y-8">
                <div className="text-center">
                  <SparklesText className="text-foreground text-lg font-semibold mb-2" sparklesCount={2}>
                    1. Craft Your Message
                  </SparklesText>
                  <p className="text-muted-foreground">
                    You craft your message — include your name and contact info.
                  </p>
                </div>
                <div className="text-center">
                  <SparklesText className="text-foreground text-lg font-semibold mb-2" sparklesCount={2}>
                    2. Agent Delivery
                  </SparklesText>
                  <p className="text-muted-foreground">
                    The agent delivers it to your crush.
                  </p>
                </div>
                <div className="text-center">
                  <SparklesText className="text-foreground text-lg font-semibold mb-2" sparklesCount={2}>
                    3. Await Response
                  </SparklesText>
                  <div className="text-muted-foreground space-y-1">
                    <p>If they accept — your name is revealed, and the acceptance is finalized on-chain.</p>
                    <p>If they reject — the agent quietly withdraws the message. No harm done.</p>
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>
        </NeonGradientCard>

        {/* The Rules Section */}
        <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
          firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
          secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
        }} borderSize={1} opacity={0.9}>
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            className="p-4"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            <div className="text-center p-6">
              <ComicText fontSize={3} style={{ color: "#ffffff" }} className="mb-6">
                The Rules
              </ComicText>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <p className="text-foreground">
                    Once accepted, you cannot send another First Signal to a different recipient for 30 days.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <p className="text-foreground">
                    If rejected, you're free to try again — anytime, with anyone.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <p className="text-foreground">
                    Acceptance and sender identity reveal happen only if your crush says yes.
                  </p>
                </div>
              </div>
            </div>
          </MagicCard>
        </NeonGradientCard>

        {/* Pricing Section */}
        <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
          firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
          secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
        }} borderSize={1} opacity={0.9}>
          <MagicCard
            gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
            className="p-4"
            gradientOpacity={0.2}
            gradientSize={50}
          >
            <div className="text-center p-6">
              <ComicText fontSize={3} style={{ color: "#ffffff" }} className="mb-6">
                Pricing
              </ComicText>
              <div className="bg-primary/20 rounded-2xl p-8 mb-6">
                <div className="text-4xl font-bold mb-2 text-primary">💌 $1.99</div>
                <div className="text-xl mb-4 text-foreground">per First Signal</div>
                <div className="text-muted-foreground space-y-1">
                  <p>Whether your crush says yes or no, this service fee is non-refundable.</p>
                  <p>Think of it as the price of courage — and maybe love.</p>
                </div>
              </div>
              <InteractiveHoverButton 
                className="min-w-[25vw]" 
                onClick={() => window.location.href = '/send'}
              >
                <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                  Let's Get Started
                </SparklesText>
              </InteractiveHoverButton>
            </div>
          </MagicCard>
        </NeonGradientCard>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop with WarpBackground */}
      <div className="hidden md:block">
        <WarpBackground perspective={1000} className="w-full h-full" gridColor={"hsl(var(--secondary))"} beamSize={2} beamsPerSide={2}>
          {heroContent}
          <FloatingMintButton onClick={() => setIsMintOverlayOpen(true)} />
        </WarpBackground>
      </div>

      {/* Mobile without WarpBackground */}
      <div className="md:hidden">
        {heroContent}
      </div>
      
      {/* Mint Overlay */}
      <MintOverlay 
        isOpen={isMintOverlayOpen} 
        onClose={() => setIsMintOverlayOpen(false)} 
      />
    </>
  )
}
