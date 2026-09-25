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

const TEAM_ID = 1234567

const navItems = [
  { title: "Dashboard", url: `/dashboard`, icon: <LayoutDashboardIcon />, active: true },
  { title: "Squad", url: `/teams/${TEAM_ID}/squad`, icon: <UsersIcon /> },
  { title: "Captain suggestion", url: `/teams/${TEAM_ID}/captain`, icon: <StarIcon /> },
  { title: "Transfer suggestion", url: `/teams/${TEAM_ID}/transfer`, icon: <ArrowRightLeftIcon /> },
  { title: "Fixtures", url: `/teams/${TEAM_ID}/fixtures`, icon: <CalendarIcon /> },
  { title: "Charts", url: `/teams/${TEAM_ID}/charts`, icon: <ChartBarIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
              href={`/teams/${TEAM_ID}/mini-leagues/314`}
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
