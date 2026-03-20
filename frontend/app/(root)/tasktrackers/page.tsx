"use client";
import React from "react";
import { useSearchParams, useRouter } from "next/navigation";

const page = () => {

    const searchParams = useSearchParams();
    const router = useRouter();

    const activeTeam = (searchParams.get("team") ?? "Team A") as "Team A" | "Team B";
    //const teamData = mockTeams[activeTeam] ?? mockTeams["Team A"];

    const mockTeams: Record<string, { active: Task[]; completed: Task[] }> = {
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
                status: "in-progress",
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

    type Task = {
        taskName: string;
        mainGoal: string;
        collaborators: string;
        dueDate: string;
        status: string;
    };

    return (
        <div className="w-full space-y-6 pr-15"
        >
            <div style={{padding: "40px 60px 40px 40px", maxWidth: "900px"}}>
                {/* Page Title */}
                <h1 style={{fontSize: "2.5rem", fontWeight: 400, marginBottom: "28px"}}>
                    Task Tracker
                </h1>
                <hr className="font-bold"></hr>


            </div>

            <div
                style={{
                    display: "flex",
                    gap: "0",
                    marginBottom: "24px",
                    borderBottom: "1px solid #d1d5db",
                }}
            >
                {(["Team A", "Team B"] as const).map((team) => (
                    <button
                        key={team}
                        //onClick={() => setActiveTeam(team)}
                        style={{
                            padding: "8px 24px",
                            fontSize: "0.95rem",
                            fontWeight: activeTeam === team ? 600 : 400,
                            backgroundColor: activeTeam === team ? "#1f2937" : "transparent",
                            color: activeTeam === team ? "#ffffff" : "#374151",
                            border: "none",
                            borderRadius: "6px 6px 0 0",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {team}
                    </button>
                ))}
            </div>



        </div>

    );
};

export default page;
