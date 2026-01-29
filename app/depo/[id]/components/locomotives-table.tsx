"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MapPin, Pencil, FileText, Settings } from "lucide-react";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { UserData } from "@/api/types/auth";
import { SpecialComponentsModal } from "./special-components-modal";

const actionButtons = [
  {
    label: "Manzil",
    icon: MapPin,
    className: "bg-[#E8F8ED] text-[#1CA34A] border border-[#1CA34A]",
  },
  {
    label: "Tahrirlash",
    icon: Pencil,
    className: "bg-[#FFF4DB] text-[#D28800] border border-[#D28800]",
  },
];

export default function LocomotivesTable() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const depotId = params.id as string;

  const { q, locModel } = Object.fromEntries(searchParams.entries());

  const { data, isPending, isError, refetch } = useGetLocomotives(
    true,
    undefined,
    {
      no_page: true,
      locomotive_model: +locModel || undefined,
      search: q,
      registered_organization: +depotId || undefined,
    }
  );
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedLocomotive, setSelectedLocomotive] = useState<{
    id: number;
    name: string;
    model_name: string;
    special_component: any | null;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const locomotives = data?.results ?? [];
  const showEmpty = !isPending && locomotives.length === 0;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  const canViewPassport = hasPermission(user, "view_locomotive_passport");
  const canEditPassport = hasPermission(user, "edit_locomotive_passport");

  const handlePasportClick = (locomotiveId: number) => {
    if (canViewPassport) {
      router.push(`/depo/${depotId}/locomotive/${locomotiveId}`);
    }
  };

  const handleEditClick = (locomotiveId: number) => {
    if (canEditPassport) {
      router.push(`/depo/${depotId}/locomotive/${locomotiveId}?edit=true`);
    }
  };

  const handleSpecialComponentsClick = (locomotive: typeof locomotives[0]) => {
    setSelectedLocomotive({
      id: locomotive.id,
      name: locomotive.name,
      model_name: locomotive.model_name,
      special_component: locomotive.special_components?.[0] || null,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLocomotive(null);
  };

  return (
    <section className="mt-6">
      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Maʼlumotlarni yuklashda xatolik yuz berdi.{" "}
          <button
            onClick={() => refetch()}
            className="font-semibold underline underline-offset-2"
          >
            Qayta urinib ko&apos;ring.
          </button>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isPending &&
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-48 rounded-2xl border border-[#E5ECF8] bg-white shadow-sm animate-pulse"
            />
          ))}

        {!isPending &&
          locomotives.map((locomotive) => (
            <article
              key={locomotive.id}
              className="grid grid-cols-[140px_1fr] gap-2 rounded-lg border border-[#E5ECF8] bg-[#F8FBFF] p-2 shadow-[0px_8px_30px_rgba(16,24,40,0.05)]"
            >
              <div className="relative h-full w-full overflow-hidden rounded-md bg-white border">
                {locomotive.model_image ? (
                  <Image
                    src={locomotive.model_image}
                    alt={locomotive.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-sm font-semibold text-muted-foreground">
                    IMG
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div className="border border-primary/10 bg-brand p-2 rounded-lg">
                  <h3 className="text-xl font-semibold text-[#0F172B]">
                    {locomotive.name + "-" + locomotive.model_name}
                  </h3>
                  {canViewPassport && (
                    <button
                      onClick={() => handlePasportClick(locomotive.id)}
                      className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#2354BF] underline cursor-pointer hover:text-[#2354BF]/80 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Pasport
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implement Manzil functionality
                      console.log(
                        "Manzil clicked for locomotive:",
                        locomotive.id
                      );
                    }}
                    className={cn(
                      "flex h-8 w-[49%] items-center justify-center rounded-sm outline-none transition hover:opacity-80",
                      actionButtons[0].className
                    )}
                    aria-label={actionButtons[0].label}
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                  {canEditPassport && (
                    <button
                      type="button"
                      onClick={() => handleEditClick(locomotive.id)}
                      className={cn(
                        "flex h-8 w-[49%] items-center justify-center rounded-sm outline-none transition hover:opacity-80",
                        actionButtons[1].className
                      )}
                      aria-label={actionButtons[1].label}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {locomotive.special_components && locomotive.special_components.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSpecialComponentsClick(locomotive)}
                    className={cn(
                      "flex h-8 w-full mt-[5px] items-center justify-center rounded-sm outline-none transition hover:opacity-80",
                      "bg-[#E8F4FD] text-[#2354BF] border border-[#2354BF]"
                    )}
                    aria-label="Maxsus komponentlar"
                    title="Maxsus komponentlar"
                  >
                    <p className="text-sm font-semibold text-[#2354BF]">Коленчатый вал</p>
                  </button>
                  )}
                </div>
              </div>
            </article>
          ))}
      </div>

      {showEmpty && (
        <div className="mt-8 rounded-2xl border border-dashed border-[#C7D7F4] bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-[#0F172B]">
            Lokomotivlar topilmadi
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">
            Filtrlash parametrlarini o&apos;zgartirib ko&apos;ring yoki qayta
            qidiruv qo&apos;llang.
          </p>
        </div>
      )}

      {selectedLocomotive && (
        <SpecialComponentsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          locomotiveName={selectedLocomotive.name}
          locomotiveModel={selectedLocomotive.model_name}
          specialComponent={selectedLocomotive.special_component}
        />
      )}
    </section>
  );
}
