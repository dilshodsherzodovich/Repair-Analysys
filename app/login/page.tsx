import { LoginForm } from "@/components/login/login-form";
import { BackgroundPattern } from "@/components/login/background-pattern";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-gradient-to-br from-[#214b66] via-[#2354bf] to-[#4978ce] items-center justify-center">
        <BackgroundPattern />
        {/* Centered Brand Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center px-12">
          <div className="w-24 h-24 mb-8 bg-white/10 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1">
                <div className="w-4 h-4 bg-[#4978ce] rounded-md"></div>
                <div className="w-4 h-4 bg-[#644ac4] rounded-md"></div>
                <div className="w-4 h-4 bg-[#2354bf] rounded-md"></div>
                <div className="w-4 h-4 bg-[#927be3] rounded-md"></div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-4 tracking-tight">
            Lokomotivlardan foydalanish tashkiloti
          </h1>
          <p className="text-lg text-white/80 font-medium mb-6 max-w-xl mx-auto">
            Lokomotivlardan foydalanish tizimi orqali ma'lumotlarni tez va
            ishonchli boshqarish. <br />
            <span className="text-[#ffd700] font-semibold">Smart Depo</span>
            platformasiga xush kelibsiz!
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#4978ce] via-[#2354bf] to-[#927be3] rounded-full mx-auto mb-2 opacity-80"></div>
        </div>
        {/* Decorative overlays remain */}
        <div className="absolute top-8 left-8 w-32 h-32 bg-[#4978ce] opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 right-8 w-24 h-24 bg-[#927be3] opacity-10 rounded-full blur-xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 py-12 lg:px-12 bg-white relative">
        {/* Mobile Brand Header */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#4978ce] to-[#214b66] rounded-xl flex items-center justify-center">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2 h-2 bg-[#4978ce] rounded-sm"></div>
                <div className="w-2 h-2 bg-[#644ac4] rounded-sm"></div>
                <div className="w-2 h-2 bg-[#2354bf] rounded-sm"></div>
                <div className="w-2 h-2 bg-[#927be3] rounded-sm"></div>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1f2937] mb-2 tracking-tight">
            Milliy statistika <span className="text-[#2354bf]">qo'mitasi</span>
          </h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[#4978ce] to-[#927be3] rounded-full mx-auto"></div>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md mx-auto">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#9e9e9e]">
            © 2024 Milliy statistika qo'mitasi. Barcha huquqlar himoyalangan.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 right-8 w-20 h-20 bg-[#4978ce] opacity-5 rounded-full blur-xl"></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 bg-[#927be3] opacity-8 rounded-full blur-lg"></div>
      </div>
    </div>
  );
}
