"use client"

import * as React from "react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  StarIcon,
  ArrowRightLeftIcon,
  CalendarIcon,
  ChartBarIcon,
  TrophyIcon,
} from "lucide-react"

const LEAGUE_ID = 314

export function AppSidebar({
  teamId,
  ...props
}: React.ComponentProps<typeof Sidebar> & { teamId: number }) {
  const navItems = [
    { title: "Dashboard", url: `/dashboard/${teamId}`, icon: <LayoutDashboardIcon />, active: true },
    { title: "Squad", url: `/teams/${teamId}/squad`, icon: <UsersIcon /> },
    { title: "Captain suggestion", url: `/teams/${teamId}/captain`, icon: <StarIcon /> },
    { title: "Transfer suggestion", url: `/teams/${teamId}/transfer`, icon: <ArrowRightLeftIcon /> },
    { title: "Fixtures", url: `/teams/${teamId}/fixtures`, icon: <CalendarIcon /> },
    { title: "Charts", url: `/teams/${teamId}/charts`, icon: <ChartBarIcon /> },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <span className="brutal-wordmark flex items-center px-2 py-1.5">Pitchside</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={item.active} tooltip={item.title}>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href={`/teams/${teamId}/mini-leagues/${LEAGUE_ID}`}
              className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium"
            >
              <TrophyIcon className="size-4" />
              <span>Standings</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
