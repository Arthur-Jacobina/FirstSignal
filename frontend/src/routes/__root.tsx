import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ThemeProvider } from '../context/ThemeContext'
import Header from '../components/Header'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Header />

        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </ThemeProvider>
  ),
})
