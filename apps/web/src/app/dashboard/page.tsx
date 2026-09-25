import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SummaryCards } from "@/components/summary-cards"
import { SquadRoster } from "@/components/squad-roster"
import { FixturesTable } from "@/components/fixtures-table"
import { StandingsTable } from "@/components/standings-table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { callRailsApi } from "@/lib/api"
import {
  fetchSquadPreview,
  fetchCaptainPreview,
  fetchTransferPreview,
  fetchFixturesPreview,
  fetchChartPreview,
  fetchRankTrajectoryPreview,
  fetchStandingsPreview,
} from "@/lib/team-dashboard"

const TEAM_ID = 1234567
const LEAGUE_ID = 314

export const dynamic = "force-dynamic"

export default async function Page() {
  const team = await callRailsApi((client) =>
    client.GET("/teams/{teamId}", { params: { path: { teamId: TEAM_ID } } })
  )

  const [
    squadPreview,
    captainPreview,
    transferPreview,
    fixturesPreview,
    chartPreview,
    rankTrajectoryPreview,
    standingsPreview,
  ] = await Promise.all([
    fetchSquadPreview(TEAM_ID),
    fetchCaptainPreview(TEAM_ID),
    fetchTransferPreview(TEAM_ID),
    fetchFixturesPreview(),
    fetchChartPreview(TEAM_ID),
    fetchRankTrajectoryPreview(TEAM_ID),
    fetchStandingsPreview(LEAGUE_ID, TEAM_ID),
  ])

  const avgPointsPerGameweek = chartPreview
    ? Math.round(chartPreview.points.reduce((sum, p) => sum + p, 0) / chartPreview.points.length)
    : null

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader teamName={team.name ?? "—"} teamId={TEAM_ID} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards
                managerName={team.manager_name ?? "—"}
                overallRank={team.overall_rank ?? null}
                totalPoints={team.total_points ?? null}
                squadCount={squadPreview ? squadPreview.picks.length : null}
                startingCount={squadPreview ? squadPreview.startingCount : null}
                avgPointsPerGameweek={avgPointsPerGameweek}
              />

              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
                {chartPreview ? (
                  <ChartAreaInteractive
                    title="Points per gameweek"
                    points={chartPreview.points}
                    latestLabel={`${Math.round(chartPreview.latest)} pts`}
                    accent
                  />
                ) : null}
                {rankTrajectoryPreview ? (
                  <ChartAreaInteractive
                    title="Rank trajectory"
                    points={rankTrajectoryPreview.points}
                    latestLabel={rankTrajectoryPreview.latest.toLocaleString("en-GB")}
                  />
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-[2fr_1fr]">
                {squadPreview ? (
                  <SquadRoster teamId={TEAM_ID} formation={squadPreview.formation} picks={squadPreview.picks} />
                ) : null}
                <SummaryCards teamId={TEAM_ID} captainPreview={captainPreview} transferPreview={transferPreview} />
              </div>

              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
                <FixturesTable
                  teamId={TEAM_ID}
                  gameweek={fixturesPreview ? fixturesPreview.gameweek : null}
                  fixtures={fixturesPreview ? fixturesPreview.fixtures : []}
                />
                {standingsPreview ? (
                  <StandingsTable
                    teamId={TEAM_ID}
                    leagueId={LEAGUE_ID}
                    leagueName={standingsPreview.leagueName}
                    standings={standingsPreview.standings}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
