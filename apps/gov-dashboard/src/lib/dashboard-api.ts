import { getApiBaseUrl } from "./api";

export type MinistryDashboardResponse = {
  data: {
    metrics: {
      schoolCount: number;
      teacherCount: number;
      studentCount: number;
      curriculumCount: number;
      lessonPlanCount: number;
      openHandoffCount: number;
    };
    schools: Array<{
      id: string;
      name: string;
      province: string | null;
      city: string | null;
      createdAt: string;
      teacherCount: number;
      studentCount: number;
      curriculumCount: number;
    }>;
    lessonPlansBySubject: Array<{
      subject: string;
      count: number;
    }>;
    curriculaBySubject: Array<{
      subject: string;
      count: number;
    }>;
    auditActions: Array<{
      action: string;
      count: number;
    }>;
    recentAudit: Array<{
      id: string;
      action: string;
      entity: string;
      tenantId: string | null;
      createdAt: string;
    }>;
  };
};

export async function fetchMinistryDashboard(
  accessToken: string,
): Promise<MinistryDashboardResponse["data"]> {
  const response = await fetch(`${getApiBaseUrl()}/dashboard/ministry`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el dashboard ministerial (${response.status})`);
  }

  const payload = (await response.json()) as MinistryDashboardResponse;
  return payload.data;
}
