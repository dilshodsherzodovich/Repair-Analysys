export function BrandSection() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#4978ce] to-[#214b66] rounded-2xl flex items-center justify-center shadow-2xl">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-3 h-3 bg-[#4978ce] rounded-sm"></div>
              <div className="w-3 h-3 bg-[#644ac4] rounded-sm"></div>
              <div className="w-3 h-3 bg-[#2354bf] rounded-sm"></div>
              <div className="w-3 h-3 bg-[#927be3] rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
        Milliy statistika
        <br />
        qo'mitasi
      </h1>

      <div className="w-16 h-1 bg-gradient-to-r from-[#4978ce] to-[#927be3] rounded-full mb-6"></div>

      <p className="text-xl text-[#e5e7eb] mb-8 max-w-md leading-relaxed">
        Korxonalar faoliyati statistikasi bo'yicha elektron hisobot tizimi
      </p>

      <div className="flex items-center space-x-6 text-[#d1d5db]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#4978ce] rounded-full"></div>
          <span className="text-sm">Xavfsiz</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#644ac4] rounded-full"></div>
          <span className="text-sm">Tezkor</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#927be3] rounded-full"></div>
          <span className="text-sm">Ishonchli</span>
        </div>
      </div>
    </div>
  )
}
