"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Trash2 } from "lucide-react";

type TeacherCourseDeleteButtonProps = {
  courseId: string;
  courseName: string;
};

export function TeacherCourseDeleteButton({
  courseId,
  courseName,
}: TeacherCourseDeleteButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiUrl || !supabaseUrl || !supabaseAnonKey) {
      setError("Falta configuración del cliente.");
      return;
    }

    const confirmed = window.confirm(
      `¿Archivar el curso "${courseName}"? Lo podés volver a cargar después.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError("Tu sesión expiró. Volvé a ingresar.");
        setSubmitting(false);
        return;
      }

      const response = await fetch(
        `${apiUrl.replace(/\/$/u, "")}/teacher-courses/${encodeURIComponent(courseId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        setError(
          response.status === 401 || response.status === 403
            ? "Tu sesión expiró o no tenés permisos."
            : "No pudimos archivar el curso.",
        );
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("teacher_course_delete_failed", err instanceof Error ? err.message : "unknown");
      setError("La conexión falló. Reintentá.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          void handleDelete();
        }}
        disabled={submitting}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#ef5da8]/40 bg-white px-3 text-sm font-bold text-[#8d174f] transition hover:bg-[#fdeaf4] disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        )}
        Archivar
      </button>
      {error ? <p className="text-xs font-medium text-[#8d174f]">{error}</p> : null}
    </div>
  );
}
