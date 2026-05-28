import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AppShell } from "../../_components/app-shell";
import { TeacherCourseForm } from "../_components/teacher-course-form";

export default function NewTeacherCoursePage() {
  return (
    <AppShell title="Nuevo curso" eyebrow="Mis cursos">
      <div className="grid gap-5 p-4 sm:p-6">
        <Link
          href="/app/estudiantes"
          prefetch={false}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-sm font-bold text-[#11231f] transition hover:border-[#18b6a4]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a mis cursos
        </Link>

        <TeacherCourseForm mode="create" />
      </div>
    </AppShell>
  );
}
