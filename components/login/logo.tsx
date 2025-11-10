import { BarChart3 } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="relative">
        <div className="w-12 h-12 bg-[#214b66] rounded-full flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4978ce] rounded-full border-1 border-white"></div>
      </div>
      <div>
        <h1 className="text-lg font-semibold text-[#1f2937]">Миллий статистика қўмитаси</h1>
        <p className="text-sm text-[#6b7280]">UZSTAT</p>
      </div>
    </div>
  )
}
