import { getApiBaseUrl } from "./api";

export type AdminConfigResponse = {
  data: {
    metrics: {
      tenantCount: number;
      userCount: number;
      roleCount: number;
      permissionCount: number;
      assignmentCount: number;
    };
    tenantsByType: Array<{
      type: string;
      count: number;
    }>;
    recentUsers: Array<{
      id: string;
      email: string | null;
      fullName: string;
      role: string;
      tenantId: string | null;
      createdAt: string;
    }>;
    roles: Array<{
      id: string;
      name: string;
      tenantId: string | null;
      userCount: number;
      permissionCount: number;
    }>;
    recentTenants: Array<{
      id: string;
      name: string;
      slug: string;
      type: string;
      createdAt: string;
    }>;
  };
};

export async function fetchAdminConfigDashboard(
  accessToken: string,
): Promise<AdminConfigResponse["data"]> {
  const response = await fetch(`${getApiBaseUrl()}/dashboard/admin-config`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la configuración administrativa (${response.status})`);
  }

  const payload = (await response.json()) as AdminConfigResponse;
  return payload.data;
}
