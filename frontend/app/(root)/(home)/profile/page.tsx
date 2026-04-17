"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";

export default function ProfilePage() {
  const userInfo = useAtomValue(userAtom);

  const fullName = userInfo?.name || "";
  const email = userInfo?.email || "";

  const firstName = fullName.split(" ")[0] || "";
  const lastName = fullName.split(" ").slice(1).join(" ") || "";

  const [preferredName, setPreferredName] = useState("");
console.log(userInfo);
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold"
          style={{ color: "#1a3a2a" }}
        >
          Profile Settings
        </h1>
        <p className="mt-2 text-gray-500">
          Manage your account information
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex gap-8 items-start">
          {/* Left side profile image */}
            <div className="w-40 flex flex-col items-center shrink-0">            <div className="h-32 w-32 rounded-xl bg-gray-200" />
            <p className="mt-3 text-sm font-semibold text-gray-500">
              PROFILE PICTURE
            </p>
          </div>

          {/* Right side user info */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  First Name
                </label>
                <input
                  value={firstName}
                  readOnly
                  className="w-full rounded-lg border p-3 bg-gray-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Last Name
                </label>
                <input
                  value={lastName}
                  readOnly
                  className="w-full rounded-lg border p-3 bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Preferred Name
              </label>
              <input
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Enter preferred name"
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                value={email}
                readOnly
                className="w-full rounded-lg border p-3 bg-gray-50"
              />
            </div>

            <p className="font-semibold text-green-800">
              ✓ Verified Student Account
            </p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold">
          Change Team
        </h2>

        <div className="flex flex-wrap gap-4">
          {[
            "Requirements",
            "Usability",
            "Front-End",
            "Back-End",
            "Quality Assurance",
          ].map((team, index) => (
            <button
              key={team}
              className={`rounded-lg border px-8 py-3 font-medium ${
                index === 2 ? "bg-[#f5c97a]" : "bg-white"
              }`}
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      {/* Standing */}
      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold">
          Change Class Standing
        </h2>

        <div className="flex gap-4">
          <button className="rounded-lg border bg-[#f5c97a] px-8 py-3 font-medium">
            Undergraduate
          </button>

          <button className="rounded-lg border bg-white px-8 py-3 font-medium">
            Graduate
          </button>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="mt-12 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            className="rounded-lg px-10 py-3 font-medium text-white"
            style={{ backgroundColor: "#1a3a2a" }}
          >
            Save Changes
          </button>

          <button className="rounded-lg border bg-white px-10 py-3 font-medium">
            Cancel
          </button>
        </div>

        <button
          className="font-semibold"
          style={{ color: "#1a3a2a" }}
        >
          Archive Account
        </button>
      </div>
    </div>
  );
}