import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { authService } from "@/api/services/auth.service";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sizga ruxsat etilmagan sahifa
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Bu sahifaga kirish uchun sizda ruxsat mavjud emas. Agar bu xatolik
            bo'lsa, adminstratorga murojaat qiling.
          </p>
          <div className="space-y-2 flex flex-col gap-1">
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Bosh sahifaga qaytish
              </Button>
            </Link>
            <Button
              onClick={() => authService.logout()}
              variant="outline"
              className="w-full"
            >
              Boshqa hisobga kirish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
