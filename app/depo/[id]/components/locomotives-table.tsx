"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Pencil, Eye } from "lucide-react";
import {
  useGetLocomotiveModels,
  useGetLocomotives,
} from "@/api/hooks/use-locomotives";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { UserData } from "@/api/types/auth";
import { LocomotiveModelData } from "@/api/types/locomotive";
import { authService } from "@/api/services/auth.service";
import { Alert, AlertDescription } from "@/ui/alert";

const actionButtons = [
  {
    label: "Tahrirlash",
    icon: Pencil,
    className: "bg-success-subtle text-success border border-success",
  },
  {
    label: "Ko'rish",
    icon: Eye,
    className: "bg-warning-subtle text-warning border border-warning",
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
    },
  );
  const { data: locomotiveModelsData } = useGetLocomotiveModels({
    no_page: true,
  });

  const getLocModelImage = useCallback(
    (locModelId: number) => {
      const locModel = locomotiveModelsData?.results?.find(
        (model: LocomotiveModelData) => model.id === locModelId,
      );
      return locModel?.image;
    },
    [locomotiveModelsData],
  );

  const [user, setUser] = useState<UserData | null>(null);
  const locomotives = data?.results ?? [];
  const showEmpty = !isPending && locomotives.length === 0;

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  const canViewPassport = hasPermission(user, "view_locomotive_passport");
  const canEditPassport = hasPermission(user, "edit_locomotive_passport");

  const handleViewClick = (locomotiveId: number) => {
    if (canViewPassport) {
      router.push(`/depo/${depotId}/locomotive/${locomotiveId}`);
    }
  };

  const handleEditClick = (locomotiveId: number) => {
    if (canEditPassport) {
      router.push(`/depo/${depotId}/locomotive/${locomotiveId}?edit=true`);
    }
  };

  return (
    <section className="mt-6">
      {isError && (
        <Alert variant="destructive" className="mb-4"><AlertDescription>
          Maʼlumotlarni yuklashda xatolik yuz berdi.{" "}
          <button
            onClick={() => refetch()}
            className="font-semibold underline underline-offset-2"
          >
            Qayta urinib ko&apos;ring.
          </button>
        </AlertDescription></Alert>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isPending &&
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-48 rounded-xl border border-border bg-background shadow-sm animate-pulse"
            />
          ))}

        {!isPending &&
          locomotives.map((locomotive) => (
            <article
              key={locomotive.id}
              className="grid grid-cols-[140px_1fr] gap-2 rounded-lg border border-border bg-surface-muted p-2 shadow-sm"
            >
              <div className="relative h-full w-full overflow-hidden rounded-md bg-background border">
                {getLocModelImage(+locomotive.model_id!) ? (
                  <Image
                    src={getLocModelImage(+locomotive.model_id!) ?? ""}
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
                  <h3 className="text-xl font-semibold text-foreground">
                    {locomotive.name + "-" + locomotive.model_name}
                  </h3>
                </div>

                <div className="mt-2 flex items-center justify-between flex-wrap">
                  {canEditPassport && (
                    <button
                      type="button"
                      onClick={() => handleEditClick(locomotive.id)}
                      className={cn(
                        "flex h-8 w-[49%] items-center justify-center rounded-sm outline-none transition hover:opacity-80",
                        actionButtons[0].className,
                      )}
                      aria-label={actionButtons[0].label}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canViewPassport && (
                    <button
                      type="button"
                      onClick={() => handleViewClick(locomotive.id)}
                      className={cn(
                        "flex h-8 w-[49%] items-center justify-center rounded-sm outline-none transition hover:opacity-80",
                        actionButtons[1].className,
                      )}
                      aria-label={actionButtons[1].label}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
      </div>

      {showEmpty && (
        <div className="mt-8 rounded-xl border border-dashed border-border-strong bg-background px-6 py-12 text-center">
          <p className="text-base font-semibold text-foreground">
            Lokomotivlar topilmadi
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Filtrlash parametrlarini o&apos;zgartirib ko&apos;ring yoki qayta
            qidiruv qo&apos;llang.
          </p>
        </div>
      )}
    </section>
  );
}
