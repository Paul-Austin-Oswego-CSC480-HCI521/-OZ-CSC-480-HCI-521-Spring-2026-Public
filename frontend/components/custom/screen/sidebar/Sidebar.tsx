"use client";
import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  BellIcon,
  Workflow,
  ListTodo,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: BellIcon,
  },

  {
    title: "WorkLogs",
    url: "/worklogs",
    icon: Workflow,
  },
  {
    title: "TaskTrackers",
    url: "/tasktrackers",
    icon: ListTodo,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent className="m-5 mt-15">
        {/* group1 for header */}
        <SidebarGroup className="m-3 mt-10 text-xl">
          HCI 521/CSC480
        </SidebarGroup>

        {/* group 2 for side bar */}
        <SidebarGroup>
          <SidebarGroupContent></SidebarGroupContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="mt-2">
                  <SidebarMenuButton
                    asChild
                    className={`hover:bg-gray-300 ${pathname === item.url ? "bg-gray-300" : ""}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span className="text-lg">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
