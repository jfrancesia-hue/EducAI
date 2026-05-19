import { KeyRound, Shield, Users } from "lucide-react";

import { GovShell } from "../_components/gov-shell";
import { KpiCard } from "../_components/kpi-card";
import { PageHeader } from "../_components/page-header";
import { requireGovSession } from "../../lib/auth/require-gov-session";
import { fetchAdminConfigDashboard } from "../../lib/admin-config-api";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const { session, tenantName, userRole } = await requireGovSession(["SUPER_ADMIN"]);
  const dashboard = await fetchAdminConfigDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="ADMIN"
        title="Configuracion administrativa"
        subtitle="Vista real de tenants, usuarios, roles y permisos registrados en la plataforma."
      />

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Users} label="Usuarios" value={dashboard.metrics.userCount} />
        <KpiCard icon={Shield} label="Roles" value={dashboard.metrics.roleCount} />
        <KpiCard icon={KeyRound} label="Permisos" value={dashboard.metrics.permissionCount} />
        <KpiCard icon={Users} label="Tenants" value={dashboard.metrics.tenantCount} />
        <KpiCard icon={Shield} label="Asignaciones" value={dashboard.metrics.assignmentCount} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Tenants por tipo
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.tenantsByType.map((item) => (
              <div key={item.type} className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.type}</p>
                  <p className="font-display text-2xl font-bold text-slate-900">{item.count}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Tenants recientes
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.recentTenants.map((tenant) => (
              <div key={tenant.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{tenant.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {tenant.type} · {tenant.slug}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">{tenant.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Roles cargados
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.roles.map((role) => (
              <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{role.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {role.tenantId ? `tenant ${role.tenantId}` : "rol global"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{role.userCount} usuarios</p>
                    <p>{role.permissionCount} permisos</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Usuarios recientes
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.recentUsers.map((user) => (
              <div key={user.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{user.email ?? "sin email"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user.role}
                      {user.tenantId ? ` · tenant ${user.tenantId}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">{user.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </GovShell>
  );
}
