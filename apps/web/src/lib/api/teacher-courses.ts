export type TeacherCourseSummary = {
  id: string;
  name: string;
  grade: number;
  subject: string;
  shift: string | null;
  studentCount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherCourseListResponse = {
  data: TeacherCourseSummary[];
};

export type TeacherCourseResponse = {
  data: TeacherCourseSummary;
};

export type TeacherCourseInput = {
  name: string;
  grade: number;
  subject: string;
  shift?: string;
  studentCount?: number;
  groupProfile?: string;
  priorKnowledge?: string;
  availableResources?: string;
  inclusionNotes?: string;
  institutionName?: string;
};

function apiBase(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return null;
  }
  return apiUrl.replace(/\/$/u, "");
}

export async function fetchTeacherCourses(accessToken: string): Promise<TeacherCourseSummary[]> {
  const base = apiBase();
  if (!base) {
    return [];
  }

  const response = await fetch(`${base}/teacher-courses`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as TeacherCourseListResponse;
  return payload.data ?? [];
}

export async function fetchTeacherCourse(
  accessToken: string,
  id: string,
): Promise<TeacherCourseSummary | null> {
  const base = apiBase();
  if (!base) {
    return null;
  }

  const response = await fetch(`${base}/teacher-courses/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as TeacherCourseResponse;
  return payload.data ?? null;
}
