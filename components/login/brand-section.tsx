export function BrandSection() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-brand-navy rounded-xl flex items-center justify-center shadow-2xl">
          <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <div className="w-3 h-3 bg-brand-purple rounded-sm"></div>
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <div className="w-3 h-3 bg-brand-purple-light rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>


      {/* kit-allow: login screen brand hero, outside the app layout */}
      <h1 className="text-4xl font-bold text-primary-foreground mb-4 leading-tight">
        Milliy statistika
        <br />
        qo'mitasi
      </h1>

      <div className="w-16 h-1 bg-gradient-to-r from-primary to-brand-purple-light rounded-full mb-6"></div>

      <p className="text-xl text-foreground-subtle mb-8 max-w-md leading-relaxed">
        Korxonalar faoliyati statistikasi bo'yicha elektron hisobot tizimi
      </p>

      <div className="flex items-center space-x-6 text-foreground-subtle">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm">Xavfsiz</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-brand-purple rounded-full"></div>
          <span className="text-sm">Tezkor</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-brand-purple-light rounded-full"></div>
          <span className="text-sm">Ishonchli</span>
        </div>
      </div>
    </div>
  )
}
