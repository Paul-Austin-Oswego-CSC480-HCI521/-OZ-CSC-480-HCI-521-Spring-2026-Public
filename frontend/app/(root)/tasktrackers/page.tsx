"use client";
import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
type Task = {
    taskName: string;
    mainGoal: string;
    collaborators: string;
    dueDate: string;
    status: string;
};

type TeamData = {
    active: Task[];
    completed: Task[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockTeams: Record<string, TeamData> = {
    "Team A": {
        active: Array(9).fill({
            taskName: "Eat an Apple",
            mainGoal: "Consume",
            collaborators: "Hamadi",
            dueDate: "Feb. 17th",
            status: "in-progress",
        }),
        completed: Array(3).fill({
            taskName: "Eat an Apple",
            mainGoal: "Consume",
            collaborators: "Hamadi",
            dueDate: "Feb. 17th",
            status: "completed",
        }),
    },
    "Team B": {
        active: Array(4).fill({
            taskName: "Write Report",
            mainGoal: "Document",
            collaborators: "Jordan",
            dueDate: "Mar. 1st",
            status: "not-started",
        }),
        completed: Array(2).fill({
            taskName: "Design Mockup",
            mainGoal: "Design",
            collaborators: "Alex",
            dueDate: "Feb. 10th",
            status: "completed",
        }),
    },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const label =
        status === "not-started"
            ? "Not Started"
            : status === "in-progress"
                ? "In-progress"
                : "Completed";

    const color =
        status === "completed"
            ? "bg-green-100 text-green-800"
            : status === "not-started"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-200 text-yellow-900";

    return (
        <span className={`${color} px-2 py-0.5 rounded text-sm font-medium`}>
      {label}
    </span>
    );
};

// ─── Task Table ───────────────────────────────────────────────────────────────
const TaskTable = ({ tasks }: { tasks: Task[] }) => (
    <table className="w-full border-collapse">
        <thead>
        <tr className="border-b-2 border-gray-300">
            {["Task Name", "Main Goal", "Collaborators", "Deadline", "Status"].map(
                (col) => (
                    <th
                        key={col}
                        className={`py-2 px-4 text-center text-sm font-medium text-gray-700 ${
                            col === "Status" ? "bg-yellow-200 rounded" : ""
                        }`}
                    >
                        {col}
                    </th>
                ),
            )}
        </tr>
        </thead>
        <tbody>
        {tasks.map((task, i) => (
            <tr
                key={i}
                className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
            >
                <td className="py-2 px-4 text-center text-sm">{task.taskName}</td>
                <td className="py-2 px-4 text-center text-sm">{task.mainGoal}</td>
                <td className="py-2 px-4 text-center text-sm">{task.collaborators}</td>
                <td className="py-2 px-4 text-center text-sm">{task.dueDate}</td>
                <td className="py-2 px-4 text-center text-sm">
                    <StatusBadge status={task.status} />
                </td>
            </tr>
        ))}
        </tbody>
    </table>
);

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabButton = ({
                       label,
                       active,
                       href,
                   }: {
    label: string;
    active: boolean;
    href: string;
}) => (
    <a
        href={href}
        className={`px-6 py-2 text-sm rounded-t-md border-none cursor-pointer transition-all ${
            active
                ? "bg-gray-800 text-white font-semibold"
                : "bg-transparent text-gray-700 font-normal"
        }`}
    >
        {label}
    </a>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function page({ team = "Team A" }: { team?: string }) {
    const teamData = mockTeams[team] ?? mockTeams["Team A"];

    return (
        <div className="p-10 mr-20 max-w-4xl overflow-y-auto">
            <h1 className="text-4xl font-normal mb-7">Task Tracker</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-300 mb-6">
                <TabButton label="Team A" active={team === "Team A"} href="?team=Team+A" />
                <TabButton label="Team B" active={team === "Team B"} href="?team=Team+B" />
            </div>

            {/* Active Tasks */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 bg-white">
                <TaskTable tasks={teamData.active} />
            </div>

            {/* Add New Task */}
            <div className="text-center mb-10">
                <button className="text-sm text-gray-700 underline bg-transparent border-none cursor-pointer py-2">
                    Add New Task
                </button>
            </div>

            {/* Completed Tasks */}
            <h2 className="text-3xl font-normal mb-4">Completed Tasks</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <TaskTable tasks={teamData.completed} />
            </div>
        </div>
    );
}