import { createFileRoute } from '@tanstack/react-router'
import { ThemeModeToggle } from '../components/theme/ThemeModeToggle'
import { ThemeColorToggle } from '../components/theme/ThemeColorToggle'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { useThemeContext } from '../context/ThemeContext'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { theme, themeColor } = useThemeContext()

  return (
    <div className="min-h-screen p-8">
      {/* Main Content Grid */}
      <main className="max-w-6xl mx-auto space-y-12">

        {/* Theme Controls Showcase */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Theme Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mode Toggle</CardTitle>
                <CardDescription>
                  Switch between light and dark themes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThemeModeToggle layout="buttons" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Theme</CardTitle>
                <CardDescription>
                  Choose from multiple color palettes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeColorToggle variant="grid" />
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Buttons Showcase */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Buttons</h3>
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>
                All button styles adapt to the current {themeColor.toLowerCase()} {theme} theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges Showcase */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Badges</h3>
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>
                Status indicators with {themeColor} theme colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Typography</h3>
          <Card>
            <CardHeader>
              <CardTitle>Text Hierarchy</CardTitle>
              <CardDescription>
                Typography in {themeColor} {theme} theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                Heading 1 - {themeColor} Theme
              </h1>
              <h2 className="text-3xl font-semibold text-foreground">
                Heading 2 - {theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
              </h2>
              <h3 className="text-2xl font-medium text-foreground">
                Heading 3 - Adaptive Design
              </h3>
              <p className="text-foreground">
                Regular body text that automatically adapts to both the color theme and light/dark mode. 
                The current configuration is <strong>{themeColor} {theme}</strong>.
              </p>
              <p className="text-muted-foreground">
                This is muted text, perfect for secondary information and metadata.
              </p>
              <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
                Theme: {theme}, Color: {themeColor}
              </code>
            </CardContent>
          </Card>
        </section>

        {/* Interactive Elements */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Forms & Inputs</h3>
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>
                Input elements with {themeColor} theme styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 rounded-md border border-border 
                             bg-background text-foreground
                             focus:outline-none focus:ring-2 focus:ring-ring
                             placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Theme Preference
                  </label>
                  <select className="w-full px-3 py-2 rounded-md border border-border 
                                   bg-background text-foreground
                                   focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value={themeColor}>{themeColor} (Current)</option>
                    <option value="system">System Default</option>
                    <option value="custom">Custom Theme</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Feedback
                </label>
                <textarea
                  placeholder={`Share your thoughts about the ${themeColor} ${theme} theme...`}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-border 
                           bg-background text-foreground
                           focus:outline-none focus:ring-2 focus:ring-ring
                           placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="primary">Submit Feedback</Button>
                <Button variant="outline">Reset Form</Button>
                <Button variant="ghost">Save Draft</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
