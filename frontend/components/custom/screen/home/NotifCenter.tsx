import { Card } from "@/components/ui/card";
import React from "react";

const NotifCenter = () => {
  return (
    <div className="w-full space-y-4 mt-10">
      <h2 className="text-2xl font-semibold">Notification Center</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Work Log Card */}
        <Card className="p-5 space-y-3 w-11/12">
          <h3 className="text-lg font-semibold">Work Log</h3>
          <div className="space-y-2">
            <div className="bg-gray-200 rounded-full px-4 py-2 text-sm">
              Week 2 - Finish Reflection for "Task 1: ..."
            </div>
            <div className="bg-gray-200 rounded-full px-4 py-2 text-sm">
              Week 1 - Work Log is overdue by 3 days.
            </div>
          </div>
          <button className="mt-2 border border-gray-300 rounded-full px-6 py-2 text-sm hover:bg-gray-100 transition-colors">
            View More
          </button>
        </Card>

        {/* Task Tracker Card */}
        <Card className="p-5 space-y-3 w-11/12">
          <h3 className="text-lg font-semibold">Task Tracker</h3>
          <div className="space-y-2">
            <div className="bg-gray-200 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium">Team A</p>
              <p>
                Task - "Example Task Name" is due - xx, xx, xxxx at: x:xxpm.
              </p>
            </div>
          </div>
          <button className="mt-2 border border-gray-300 rounded-full px-6 py-2 text-sm hover:bg-gray-100 transition-colors">
            View More
          </button>
        </Card>
      </div>
    </div>
  );
};

export default NotifCenter;
