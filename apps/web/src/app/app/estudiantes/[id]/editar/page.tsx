import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "../../../_components/app-shell";
import { TeacherCourseForm } from "../../_components/teacher-course-form";
import { fetchTeacherCourse } from "../../../../../lib/api/teacher-courses";
import { getEducaiAppAuth } from "../../../../../lib/supabase/app-auth";

type EditTeacherCoursePageProps = {
  params: {
    id: string;
  };
};

export default async function EditTeacherCoursePage({ params }: EditTeacherCoursePageProps) {
  const { accessToken } = await getEducaiAppAuth();
  const course = accessToken ? await fetchTeacherCourse(accessToken, params.id) : null;

  if (!course) {
    notFound();
  }

  return (
    <AppShell title={`Editar ${course.name}`} eyebrow="Mis cursos">
      <div className="grid gap-5 p-4 sm:p-6">
        <Link
          href="/app/estudiantes"
          prefetch={false}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-sm font-bold text-[#11231f] transition hover:border-[#18b6a4]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a mis cursos
        </Link>

        <TeacherCourseForm
          mode="edit"
          initialValues={{
            id: course.id,
            name: course.name,
            grade: course.grade,
            subject: course.subject,
            shift: course.shift ?? undefined,
            studentCount: course.studentCount ?? undefined,
          }}
        />
      </div>
    </AppShell>
  );
}
