"use client";
import { Home, BellIcon, FileText, LogOutIcon } from "lucide-react";

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
  // if (userInfo && userInfo.role == "instructor") {
  //   const items = [{ title: "Home", url: "/", icon: Home }];
  // }
  if (userInfo && userInfo.role == "student") {
    items = [
      { title: "Home", url: "/", icon: Home },
      { title: "Notifications", url: "/notification", icon: BellIcon },
      { title: "Weekly Work Logs", url: "/notifications", icon: FileText },
      // { title: "Tasktracker", url: "/tasktracker", icon: Workflow },
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
    <Sidebar>
      <SidebarContent className="m-5 mt-15">
        <SidebarGroup className="m-3 mt-10 space-y-1">
          <p className="text-lg font-semibold tracking-tight text-[#e8c97a]">
            LakerTracks
          </p>
          <p className="text-sm text-sidebar-foreground/90">Student Hub</p>
          <p className="text-xs text-sidebar-foreground/60">HCI 521 · Spring 2026</p>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent />
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="mt-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="h-auto rounded-lg py-2.5 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:!bg-[#fed59a] data-[active=true]:!text-[#1e4b35] data-[active=true]:hover:!bg-[#fed59a] data-[active=true]:hover:!text-[#1e4b35] [&>svg]:!size-5"
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem className="mt-2">
                <SidebarMenuButton
                  className="h-auto cursor-pointer rounded-lg py-2.5 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:!size-5"
                  onClick={handleLogout}
                >
                  <LogOutIcon />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
