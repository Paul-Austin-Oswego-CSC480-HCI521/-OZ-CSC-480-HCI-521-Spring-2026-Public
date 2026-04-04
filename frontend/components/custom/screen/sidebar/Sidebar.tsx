"use client";
import { Home, BellIcon, Workflow, LogOutIcon } from "lucide-react";

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

export function AppSidebar() {
  const userInfo = useAtomValue(userAtom);
  var items = [{ title: "Home", url: "/", icon: Home }];
  // if (userInfo && userInfo.role == "instructor") {
  //   const items = [{ title: "Home", url: "/", icon: Home }];
  // }
  if (userInfo && userInfo.role == "student") {
    items = [
      { title: "Home", url: "/", icon: Home },
      { title: "Worklog Status", url: "/notifications", icon: BellIcon },
      { title: "Notification", url: "#", icon: Workflow },
      { title: "Tasktracker", url: "#", icon: Workflow },
    ];
  }
  const pathname = usePathname();
  const router = useRouter();
  const setToken = useSetAtom(tokenAtom);

  const handleLogout = () => {
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
        <SidebarGroup className="m-3 mt-10 text-xl">
          HCI 521/CSC480
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent />
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

              <SidebarMenuItem className="mt-2">
                <SidebarMenuButton
                  className="hover:bg-gray-300 cursor-pointer"
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
