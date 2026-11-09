import { BarChart3 } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="relative">
        <div className="w-12 h-12 bg-brand-navy rounded-full flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-1 border-background"></div>
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">Миллий статистика қўмитаси</h1>
        <p className="text-sm text-muted-foreground">UZSTAT</p>
      </div>
    </div>
  )
}
