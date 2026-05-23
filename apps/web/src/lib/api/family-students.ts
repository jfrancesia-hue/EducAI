export type FamilyStudent = {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  profile?: {
    whatsappPhone?: string | null;
    whatsappContacts?: Array<{
      id: string;
      role: "STUDENT" | "PARENT" | "GUARDIAN";
      phone: string;
      displayName?: string | null;
    }>;
  } | null;
};

type StudentResponse = {
  data: FamilyStudent[];
};

export type FamilyStudentsFetchResult = {
  students: FamilyStudent[];
  error: "missing_api_url" | "request_failed" | null;
};

export async function fetchFamilyStudents(accessToken: string): Promise<FamilyStudentsFetchResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { students: [], error: "missing_api_url" };
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/students`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return { students: [], error: "request_failed" };
    }

    const payload = (await response.json()) as StudentResponse;
    return { students: payload.data ?? [], error: null };
  } catch {
    return { students: [], error: "request_failed" };
  }
}
