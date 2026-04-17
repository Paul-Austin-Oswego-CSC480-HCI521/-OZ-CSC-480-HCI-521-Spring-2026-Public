"use client";

import {
  Home,
  Bell,
  ClipboardList,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import {
  tokenAtom,
  userAtom,
} from "@/components/custom/utils/context/state";
import { logout } from "@/components/custom/utils/api_utils/req/req";
import Link from "next/link";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Weekly Logs", url: "/worklogs", icon: ClipboardList },
  { title: "Notifications", url: "/notification", icon: Bell },
  { title: "Support", url: "/support", icon: HelpCircle },
];

export function AppSidebar() {
  const userInfo = useAtomValue(userAtom);
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
        .replace(
          /=.*/,
          "=;expires=" + new Date(0).toUTCString() + ";path=/"
        );
    });

    router.push("/signup");
  };

  const isProfileActive = pathname === "/profile";

  return (
    <aside
      className="flex flex-col h-screen w-[210px] shrink-0 fixed left-0 top-0 z-40"
      style={{ backgroundColor: "#1a3a2a" }}
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <div
          className="text-xl font-bold leading-tight"
          style={{ color: "#f5a623" }}
        >
          LakerTracks
        </div>
        <div className="text-sm font-semibold text-white mt-0.5">
          Student Hub
        </div>
        <div className="text-xs mt-1" style={{ color: "#7daa8b" }}>
          HCI 521 | Spring 2026
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.url;

          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-[#1a3a2a] font-semibold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              style={isActive ? { backgroundColor: "#f5c97a" } : {}}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Profile + Logout */}
      <div className="px-3 pb-6 space-y-1">
        <div className="border-t border-white/10 mb-3" />

        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isProfileActive
              ? "text-[#1a3a2a] font-semibold"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
          style={isProfileActive ? { backgroundColor: "#f5c97a" } : {}}
        >
          <User className="h-4 w-4 shrink-0" />
          Profile
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}