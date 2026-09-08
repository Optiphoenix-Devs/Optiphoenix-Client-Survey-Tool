import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { TeamListItem } from "@/lib/teams";
import { formatMonthYear } from "@/lib/format";

export function TeamsOverview({ teams }: { teams: TeamListItem[] }) {
  const top = teams.slice(0, 6);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Teams overview</h2>
          <p className="mt-0.5 text-sm text-muted">
            Every workspace across the organisation and what it holds.
          </p>
        </div>
        <Link
          href="/dashboard/teams"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          All teams <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {top.length === 0 ? (
        <p className="app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          No teams yet — create one to start onboarding clients.
        </p>
      ) : (
        <div className="directory-table-wrap card-enter">
          <table className="directory-table w-full min-w-[40rem] text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Team</th>
                <th className="px-4 py-3 text-center font-medium text-muted">Members</th>
                <th className="px-4 py-3 text-center font-medium text-muted">Clients</th>
                <th className="px-4 py-3 text-center font-medium text-muted">Forms</th>
                <th className="px-4 py-3 text-center font-medium text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {top.map((team) => (
                <tr
                  key={team.id}
                  className="border-t border-border/60 transition hover:bg-hover"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/teams/${team.id}`}
                      className="flex items-center gap-2.5 font-medium text-foreground hover:text-brand"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center app-radius bg-indigo-100 text-indigo-800 ring-1 ring-indigo-600/20 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-500/30">
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="truncate">{team.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted">
                    {team._count.members}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted">
                    {team._count.clients}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted">
                    {team._count.forms}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted">
                    {formatMonthYear(team.createdAt.toISOString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
