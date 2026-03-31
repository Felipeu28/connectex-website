import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 grid-bg">
      <div className="text-center max-w-lg">
        <p className="text-8xl sm:text-9xl font-black gradient-text mb-6">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
          Page not found
        </h1>
        <p className="text-[var(--text-muted)] mb-10 leading-relaxed">
          The page you are looking for does not exist or has been moved.
          Let us help you find the right technology solution instead.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="cta" size="lg" href="/">
            Go Home
          </Button>
          <Button variant="secondary" size="lg" href="/solutions">
            View Solutions
          </Button>
        </div>
      </div>
    </section>
  )
}
