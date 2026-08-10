import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import "../../styles/admin.css";
import DashboardNav from "../../components/layout/DashboardNav";
import { api, ApiError } from "../../lib/api";
import type { AdminEventDto, AdminUserDto, PlanTier, UserRole } from "../../types/api";

const PLAN_OPTIONS: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
const ROLE_OPTIONS: UserRole[] = ["USER", "ADMIN"];

type Tab = "users" | "events";

export default function AdminPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<AdminUserDto[]>("/admin/users"),
  });

  const events = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => api.get<AdminEventDto[]>("/admin/events"),
    enabled: tab === "events",
  });

  const updateUser = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { plan?: PlanTier; role?: UserRole } }) =>
      api.patch<AdminUserDto>(`/admin/users/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  // The backend is the authority on who is an admin; this only decides which
  // screen to render when it says no.
  const forbidden = users.error instanceof ApiError && users.error.status === 403;

  if (forbidden) {
    return (
      <>
        <DashboardNav />
        <main className="container section-tight">
          <div className="empty-state">
            <h2>{t("admin.forbiddenHeading")}</h2>
            <p>{t("admin.forbiddenBody")}</p>
            <Link to="/dashboard" className="btn">
              {t("common.backToDashboard")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNav />
      <main className="container section-tight">
        <div className="dash-header">
          <div>
            <p className="eyebrow">{t("admin.eyebrow")}</p>
            <h2>{t("admin.heading")}</h2>
          </div>
        </div>

        <div className="op-module-tabs" role="tablist" aria-label={t("admin.tabsAriaLabel")}>
          <button
            role="tab"
            aria-selected={tab === "users"}
            className={`op-module-tab${tab === "users" ? " active" : ""}`}
            onClick={() => setTab("users")}
          >
            <span className="op-module-tab-index">01</span>
            {t("admin.tabUsers")}
          </button>
          <button
            role="tab"
            aria-selected={tab === "events"}
            className={`op-module-tab${tab === "events" ? " active" : ""}`}
            onClick={() => setTab("events")}
          >
            <span className="op-module-tab-index">02</span>
            {t("admin.tabEvents")}
          </button>
        </div>

        {tab === "users" && (
          <section>
            {(users.isLoading || users.fetchStatus === "paused") && (
              <div className="empty-state">{t("common.loading")}</div>
            )}
            {users.error && !forbidden && <p className="form-error">{t("admin.usersLoadError")}</p>}
            {users.data && (
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("admin.colUser")}</th>
                      <th scope="col">{t("admin.colPlan")}</th>
                      <th scope="col">{t("admin.colRole")}</th>
                      <th scope="col">{t("admin.colEvents")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <span className="admin-table-sub">{u.email}</span>
                        </td>
                        <td>
                          <select
                            className="input admin-select"
                            value={u.plan}
                            disabled={updateUser.isPending}
                            onChange={(e) =>
                              updateUser.mutate({ id: u.id, patch: { plan: e.target.value as PlanTier } })
                            }
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {t(`dashboard.plan.${p}`)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="input admin-select"
                            value={u.role}
                            disabled={updateUser.isPending}
                            onChange={(e) =>
                              updateUser.mutate({ id: u.id, patch: { role: e.target.value as UserRole } })
                            }
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {t(`admin.role.${r}`)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="mono">{u.eventCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {updateUser.error && (
              <p className="form-error" role="alert">
                {updateUser.error instanceof ApiError ? updateUser.error.message : t("admin.updateError")}
              </p>
            )}
          </section>
        )}

        {tab === "events" && (
          <section>
            {(events.isLoading || events.fetchStatus === "paused") && (
              <div className="empty-state">{t("common.loading")}</div>
            )}
            {events.error && <p className="form-error">{t("admin.eventsLoadError")}</p>}
            {events.data && (
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("admin.colEvent")}</th>
                      <th scope="col">{t("admin.colOwner")}</th>
                      <th scope="col">{t("admin.colStatus")}</th>
                      <th scope="col">{t("admin.colSessions")}</th>
                      <th scope="col">
                        <span className="visually-hidden">{t("admin.colOpen")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.data.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <strong>{e.name}</strong>
                          <span className="admin-table-sub mono">{e.joinCode}</span>
                        </td>
                        <td>
                          {e.ownerName}
                          <span className="admin-table-sub">{e.ownerEmail}</span>
                        </td>
                        <td>
                          <span className={`badge${e.status === "LIVE" ? " badge-live" : ""}`}>
                            {t(`common.eventStatus.${e.status}`)}
                          </span>
                        </td>
                        <td className="mono">{e.sessionCount}</td>
                        <td>
                          {/* Opens in the organiser's own screens — admins get
                              ownership override on the API, so no separate
                              admin-only editor has to exist. */}
                          <Link to={`/dashboard/events/${e.id}`} className="btn btn-sm">
                            {t("admin.colOpen")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
