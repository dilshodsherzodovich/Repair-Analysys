"use client";

import { useState } from "react";
import { StructureTable } from "@/components/structure/structure-table";

interface Bulletin {
  id: string;
  name: string;
  category: string;
  createdDate: string;
  responsibleAssigned: boolean;
  responsible: string;
  status: "active" | "inactive" | "completed";
  responsibleDepartment: string;
  receivingOrganizations: string[];
  responsiblePersons: string[];
  periodType: string;
}

export default function StructurePage() {
  const [bulletins] = useState<Bulletin[]>([
    {
      id: "1",
      name: "Qashqadaryo viloyatining 2025 yil 1-yarim yilligi hisoboti",
      category: "Qishloq xo'jaligi",
      createdDate: "01.06.2025",
      responsibleAssigned: true,
      responsible: "Umarov A.P.",
      status: "active",
      responsibleDepartment: "Qishloq xo'jaligi Quyi tashkiloti",
      receivingOrganizations: ["org1", "org2"],
      responsiblePersons: ["person1", "person2"],
      periodType: "Yarim yillik",
    },
    {
      id: "2",
      name: "San'at va madaniyat sohasidagi faoliyat hisoboti",
      category: "San'at",
      createdDate: "15.06.2025",
      responsibleAssigned: true,
      responsible: "Siddiqov M.R.",
      status: "completed",
      responsibleDepartment: "San'at Quyi tashkiloti",
      receivingOrganizations: ["org3", "org4"],
      responsiblePersons: ["person3", "person4"],
      periodType: "Oylik",
    },
    {
      id: "3",
      name: "Tibbiyot xizmatlari sifatini oshirish bo'yicha hisoboti",
      category: "Tibbiyot",
      createdDate: "20.06.2025",
      responsibleAssigned: true,
      responsible: "Karimov Sh.T.",
      status: "active",
      responsibleDepartment: "Tibbiyot Quyi tashkiloti",
      receivingOrganizations: ["org5"],
      responsiblePersons: ["person5"],
      periodType: "Haftalik",
    },
    {
      id: "4",
      name: "Ta'lim sohasidagi yangiliklar va rejalar",
      category: "Ta'lim",
      createdDate: "25.06.2025",
      responsibleAssigned: false,
      responsible: "",
      status: "inactive",
      responsibleDepartment: "Ta'lim Quyi tashkiloti",
      receivingOrganizations: ["org6", "org7"],
      responsiblePersons: ["person6"],
      periodType: "Kunlik",
    },
    {
      id: "5",
      name: "Iqtisodiy rivojlanish va investitsiyalar hisoboti",
      category: "Iqtisodiyot",
      createdDate: "30.06.2025",
      responsibleAssigned: true,
      responsible: "Yusupov D.A.",
      status: "active",
      responsibleDepartment: "Iqtisodiyot Quyi tashkiloti",
      receivingOrganizations: ["org8"],
      responsiblePersons: ["person7", "person8"],
      periodType: "Yillik",
    },
    {
      id: "6",
      name: "Qishloq xo'jaligi mahsulotlari eksporti hisoboti",
      category: "Qishloq xo'jaligi",
      createdDate: "05.07.2025",
      responsibleAssigned: true,
      responsible: "Rahimov T.S.",
      status: "active",
      responsibleDepartment: "Qishloq xo'jaligi Quyi tashkiloti",
      receivingOrganizations: ["org1", "org3", "org5"],
      responsiblePersons: ["person1", "person3"],
      periodType: "Yarim yillik",
    },
    {
      id: "7",
      name: "Madaniy meros va tarixiy yodgorliklar hisoboti",
      category: "San'at",
      createdDate: "10.07.2025",
      responsibleAssigned: true,
      responsible: "Mirzaev K.X.",
      status: "completed",
      responsibleDepartment: "San'at Quyi tashkiloti",
      receivingOrganizations: ["org2", "org4"],
      responsiblePersons: ["person2", "person4"],
      periodType: "Oylik",
    },
    {
      id: "8",
      name: "Xalq sog'lig'ini saqlash va tibbiyot xizmatlari",
      category: "Tibbiyot",
      createdDate: "15.07.2025",
      responsibleAssigned: false,
      responsible: "",
      status: "inactive",
      responsibleDepartment: "Tibbiyot Quyi tashkiloti",
      receivingOrganizations: ["org6"],
      responsiblePersons: ["person6"],
      periodType: "Haftalik",
    },
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Byulleten strukturalari
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Byulleten strukturalarini ko'rish va boshqarish
          </p>
        </div>
      </div>

      <StructureTable bulletins={bulletins} />
    </div>
  );
}
