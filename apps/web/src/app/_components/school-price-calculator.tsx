"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

import { Badge } from "@educai/ui";
import { calculateSchoolMonthlyPrice, formatArs, schoolPricing } from "../../lib/pricing";

export function SchoolPriceCalculator() {
  const [teachers, setTeachers] = useState(schoolPricing.exampleTeachers);
  const price = useMemo(() => calculateSchoolMonthlyPrice(teachers), [teachers]);
  const extraTeachers = Math.max(0, teachers - schoolPricing.baseTeachers);

  return (
    <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e7fbf7] text-[#087968]">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <Badge className="bg-[#fff6c9] text-[#876100]">Calculador Colegio</Badge>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Costo mensual estimado
          </h3>
        </div>
      </div>

      <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="teachers">
        Docentes activos en el mes
      </label>
      <input
        id="teachers"
        type="number"
        min={1}
        max={250}
        value={teachers}
        onChange={(event) => setTeachers(Number(event.target.value) || 1)}
        className="mt-2 h-12 w-full rounded-lg border border-[#cfdcd7] bg-white px-4 text-lg font-semibold outline-none transition focus:border-[#087968] focus:ring-2 focus:ring-[#18b6a4]/20"
      />

      <div className="mt-5 grid gap-3 rounded-lg bg-[#f7f8f3] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Base incluida</span>
          <span className="font-semibold">{schoolPricing.baseTeachers} docentes</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Docentes adicionales</span>
          <span className="font-semibold">{extraTeachers}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#d5e1dc] pt-3">
          <span className="text-sm font-semibold text-slate-700">Total mensual</span>
          <span className="font-display text-3xl font-bold">{formatArs(price)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        Docente activo es quien genero al menos una planificacion durante el mes.
      </p>
    </div>
  );
}
