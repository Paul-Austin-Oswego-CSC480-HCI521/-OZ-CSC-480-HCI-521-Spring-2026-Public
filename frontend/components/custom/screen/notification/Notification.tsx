"use client";

export const Notification = () => {
  return (
    <div className="w-full p-8 space-y-8">
      {/* Page Title */}
      <h1 className="text-4xl font-semibold">Notifications</h1>

      {/* Work Log Section */}
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <h2 className="text-2xl font-medium">Work Log</h2>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => console.log("Clicked work log 1")}
            className="block w-full rounded-md bg-secondary px-4 py-3 text-left
                 cursor-pointer hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            Week 2 – Finish Reflection for “Task 1: …”
          </button>

          <button
            type="button"
            onClick={() => console.log("Clicked work log 2")}
            className="block w-full rounded-md bg-secondary px-4 py-3 text-left
                 cursor-pointer hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            Week 1 – Work Log is overdue by 3 days.
          </button>

          <button
            type="button"
            onClick={() => console.log("Clicked example 1")}
            className="block w-full rounded-md bg-secondary px-4 py-3 text-left italic
                 cursor-pointer hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            [Example Work Log Notification.]
          </button>

          <button
            type="button"
            onClick={() => console.log("Clicked example 2")}
            className="block w-full rounded-md bg-secondary px-4 py-3 text-left italic
                 cursor-pointer hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            [Example Work Log Notification.]
          </button>
        </div>
      </div>

      {/* Task Tracker Section */}
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <h2 className="text-2xl font-medium">Task Tracker</h2>

        <div className="space-y-4">
          <div className="bg-secondary rounded-md p-4">
            <p className="font-semibold italic">Team A</p>
            <p>Task – “Example Task Name” is due – xx, xx, xxxx at x:xxpm.</p>
          </div>

          <div className="bg-secondary rounded-md p-4">
            <p className="font-semibold italic">Team A</p>
            <p>Task – “Example Task Name” is due – xx, xx, xxxx at x:xxpm.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
