import React from "react";
import { Input } from "@/components/ui/input";
import { Search, UserCircle } from "lucide-react";
const Topbar = () => {
  return (
    <div className="w-full bg-zinc-900 text-white flex items-center justify-between px-6 py-3 relative z-50">
      <span className="text-sm font-medium">Weekly Work Log Tracker</span>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-8 h-8 w-48 bg-white text-black text-sm rounded-md"
          />
        </div>
        <UserCircle className="h-7 w-7 text-white" />
      </div>
    </div>
  );
};

export default Topbar;
