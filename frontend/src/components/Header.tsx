import { ThemeModeToggle } from './theme/ThemeModeToggle'
import { ConnectWallet } from './connect-wallet'

export default function Header() {
  return (
    <header className="p-2 lg:px-16 flex gap-2 bg-background text-foreground justify-between items-center sticky top-0 z-50">
      <div className="flex flex-row items-center">
        <img src={'/logo.png'} alt="logo" className="h-12 w-12" />
        <h1 className="text-[#EF88AD]">First Signal</h1>
      </div>
      <div className="flex flex-row lg:space-x-4 space-x-2 justify-center">
        <ConnectWallet />
        <ThemeModeToggle layout="icon" />
      </div>
    </header>
  )
}
