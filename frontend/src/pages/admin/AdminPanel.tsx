import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import "../../styles/admin.css";
import DashboardNav from "../../components/layout/DashboardNav";
import Pagination from "../../components/shared/Pagination";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { AdminEventDto, AdminUserDto, PageResponse, PlanTier, UserRole } from "../../types/api";

const PLAN_OPTIONS: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
const ROLE_OPTIONS: UserRole[] = ["USER", "ADMIN"];
const PAGE_SIZE = 20;
const TABS = ["users", "events"] as const;

type Tab = (typeof TABS)[number];

export default function AdminPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Which tab and which page live in the URL rather than in component state:
  // a refresh used to drop an admin back on Users no matter where they were,
  // and this also makes a particular page of the table linkable and puts it in
  // browser history, so Back goes where it looks like it should.
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "users";

  // 1-based in the URL to match the numbers on the buttons, 0-based everywhere
  // below because that is what the API takes.
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam - 1 : 0;

  function goTo(nextTab: Tab, nextPage: number) {
    const next = new URLSearchParams();
    if (nextTab !== "users") next.set("tab", nextTab);
    if (nextPage > 0) next.set("page", String(nextPage + 1));
    setSearchParams(next, { replace: false });
  }

  const setTab = (nextTab: Tab) => goTo(nextTab, 0);
  const setPage = (nextPage: number) => goTo(tab, nextPage);

  const users = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => api.get<PageResponse<AdminUserDto>>(`/admin/users?page=${page}&size=${PAGE_SIZE}`),
    enabled: tab === "users",
    // Holds the previous page on screen while the next one loads, so paging
    // does not collapse the table to a loading state and jump the scroll.
    placeholderData: keepPreviousData,
  });

  const events = useQuery({
    queryKey: ["admin-events", page],
    queryFn: () => api.get<PageResponse<AdminEventDto>>(`/admin/events?page=${page}&size=${PAGE_SIZE}`),
    enabled: tab === "events",
    placeholderData: keepPreviousData,
  });

  // A ?page= from a stale bookmark can point past the end of the table, which
  // the API answers with an empty page rather than an error. Fall back to the
  // last real page instead of showing an empty table under a page number that
  // no longer exists.
  const active = tab === "users" ? users.data : events.data;
  useEffect(() => {
    if (!active || active.totalPages === 0) return;
    if (active.page > active.totalPages - 1) setPage(active.totalPages - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.page, active?.totalPages]);

  const updateUser = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { plan?: PlanTier; role?: UserRole; blocked?: boolean } }) =>
      api.patch<AdminUserDto>(`/admin/users/${id}`, patch),
    // Prefix key, so whichever page is on screen refetches.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  // The backend is the authority on who is an admin; this only decides which
  // screen to render when it says no. Both queries are checked because only
  // the active tab's one runs — landing straight on ?tab=events must still
  // show the refusal rather than an empty table.
  const forbidden =
    (users.error instanceof ApiError && users.error.status === 403) ||
    (events.error instanceof ApiError && events.error.status === 403);

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
                      <th scope="col">{t("admin.colStatus")}</th>
                      <th scope="col">{t("admin.colEvents")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data.content.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      return (
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
                          <td>
                            <div className="admin-status-cell">
                              <span className={`badge${u.blocked ? " badge-danger" : ""}`}>
                                {t(u.blocked ? "admin.status.blocked" : "admin.status.active")}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                disabled={updateUser.isPending || isSelf}
                                title={isSelf ? t("admin.cannotBlockSelf") : undefined}
                                onClick={() => updateUser.mutate({ id: u.id, patch: { blocked: !u.blocked } })}
                              >
                                {t(u.blocked ? "admin.unblock" : "admin.block")}
                              </button>
                            </div>
                          </td>
                          <td className="mono">{u.eventCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {users.data && (
              <Pagination
                page={users.data.page}
                totalPages={users.data.totalPages}
                summary={t("admin.usersTotal", { count: users.data.totalElements })}
                disabled={users.isFetching}
                onChange={setPage}
              />
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
                    {events.data.content.map((e) => (
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
            {events.data && (
              <Pagination
                page={events.data.page}
                totalPages={events.data.totalPages}
                summary={t("admin.eventsTotal", { count: events.data.totalElements })}
                disabled={events.isFetching}
                onChange={setPage}
              />
            )}
          </section>
        )}
      </main>
    </>
  );
}
