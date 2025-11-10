export function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#4978ce] opacity-10 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-[#644ac4] opacity-15 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-16 w-40 h-40 bg-[#2354bf] opacity-8 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-[#927be3] opacity-12 rounded-full blur-xl"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-[#214b66] rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
