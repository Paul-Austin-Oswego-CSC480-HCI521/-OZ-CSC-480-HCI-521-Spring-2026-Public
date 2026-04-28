"use client";
import {
  Home,
  BellIcon,
  Workflow,
  LogOutIcon,
  UserIcon,
  LayoutDashboard,
  Users,
  Archive,
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
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { tokenAtom, userAtom } from "@/components/custom/utils/context/state";
import { logout } from "@/components/custom/utils/api_utils/req/req";

export function AppSidebar() {
  const userInfo = useAtomValue(userAtom);
  var items = [{ title: "Home", url: "/", icon: Home }];
  if (userInfo && userInfo.role == "student" && userInfo.classID) {
    const hasRealTeam = (userInfo.team ?? []).some(
      (t) => t && t.toLowerCase() !== "unassigned",
    );
    items = hasRealTeam
      ? [
          { title: "Home", url: "/", icon: Home },
          { title: "Notification", url: "/notification", icon: Workflow },
          { title: "Weekly Work Logs", url: "/notifications", icon: BellIcon },
          { title: "Profile", url: "/profile", icon: UserIcon },
        ]
      : [
          { title: "Home", url: "/", icon: Home },
          { title: "Profile", url: "/profile", icon: UserIcon },
        ];
  }
  if (userInfo && userInfo.role == "instructor") {
    items = [
      { title: "Dashboard", url: "/instructor", icon: LayoutDashboard },
      { title: "Manage Class", url: "/instructor/classes", icon: Users },
      { title: "Archived Class", url: "/instructor/archived", icon: Archive },
      { title: "Profile Settings", url: "/profile", icon: UserIcon },
    ];
  }
  const pathname = usePathname();
  const router = useRouter();
  const setToken = useSetAtom(tokenAtom);

  const handleLogout = async () => {
    await logout();
    setToken(null);
    localStorage.removeItem("csc_480_token");
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });
    router.push("/signup");
  };

  return (
    <Sidebar
      className="[&_[data-sidebar=sidebar]]:!bg-[#1E4B35] [&_[data-sidebar=sidebar]]:!text-white"
      style={
        {
          "--sidebar": "#1E4B35",
          "--sidebar-foreground": "#ffffff",
          "--sidebar-accent": "rgba(255,255,255,0.12)",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "rgba(255,255,255,0.1)",
          "--sidebar-ring": "#f59e0b",
        } as React.CSSProperties
      }
    >
      <SidebarContent className="m-5 mt-10 text-white overflow-x-hidden">
        <SidebarGroup className="mx-3 mt-4 mb-6 space-y-0.5">
          <p className="text-2xl font-bold text-amber-400 leading-tight">
            LakerLogs
          </p>
          <p className="text-lg font-semibold text-white leading-tight">
            {userInfo?.role === "instructor"
              ? "Instructor Portal"
              : "Student Hub"}
          </p>
          <p className="text-xs text-white/70 leading-tight pt-0.5">
            CSC 480 | HCI 521
          </p>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent />
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="mt-2">
                  <SidebarMenuButton
                    asChild
                    className={`hover:bg-white/10 ${pathname === item.url ? "bg-amber-400 text-[#1E4B35] hover:bg-amber-400" : ""}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span className="text-lg">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem className="mt-2">
                <SidebarMenuButton
                  className="hover:bg-white/10 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOutIcon />
                  <span className="text-lg">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
