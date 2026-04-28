"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import {
  getUsersFromClass,
  updatePreferredName,
  addUserTeam,
  removeUserTeam,
  updateUserStanding,
  refreshToken,
} from "@/components/custom/utils/api_utils/req/req";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Info,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

function splitFullName(full: string | undefined): { first: string; last: string } {
  if (!full) return { first: "", last: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

const TEAMS = [
  "Requirements",
  "Usability",
  "Front-End",
  "Back-End",
  "Quality Assurance",
] as const;

const STANDINGS = ["Undergraduate", "Graduate"] as const;

const SENTINEL_TEAM = "unassigned";
const isSentinelTeam = (t: string) => t.toLowerCase() === SENTINEL_TEAM;

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function Profile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userInfo = useAtomValue(userAtom);

  const { data: classUsers, isLoading } = useQuery({
    queryKey: ["users-from-class", userInfo?.classID],
    queryFn: () => getUsersFromClass(userInfo?.classID ?? ""),
    enabled: !!userInfo?.classID,
  });

  const fetchedUser = useMemo(() => {
    if (!classUsers || !userInfo?.email) return null;
    return (
      (classUsers as any[]).find((u) => u.email === userInfo.email) ?? null
    );
  }, [classUsers, userInfo?.email]);

  const [preferredName, setPreferredName] = useState("");
  const [team, setTeam] = useState<string[]>([]);
  const [classStanding, setClassStanding] = useState<string>("");
  const [sentinelValue, setSentinelValue] = useState<string | null>(null);
  const [initial, setInitial] = useState<{
    preferredName: string;
    team: string[];
    classStanding: string;
  } | null>(null);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  useEffect(() => {
    if (!userInfo) return;
    const initialPreferred =
      fetchedUser?.preferredName ?? userInfo.preferredName ?? "";
    const rawTeam: string[] = fetchedUser?.team ?? userInfo.team ?? [];
    const sentinel = rawTeam.find(isSentinelTeam) ?? null;
    const initialTeam = rawTeam.filter((t) => !isSentinelTeam(t));
    const initialStanding: string = fetchedUser?.classStanding ?? "";
    setPreferredName(initialPreferred);
    setTeam(initialTeam);
    setClassStanding(initialStanding);
    setSentinelValue(sentinel);
    setInitial({
      preferredName: initialPreferred,
      team: initialTeam,
      classStanding: initialStanding,
    });
  }, [fetchedUser, userInfo]);

  const isDirty = useMemo(() => {
    if (!initial) return false;
    if (preferredName !== initial.preferredName) return true;
    if (classStanding !== initial.classStanding) return true;
    if (team.length !== initial.team.length) return true;
    const a = [...team].map((t) => t.toLowerCase()).sort();
    const b = [...initial.team].map((t) => t.toLowerCase()).sort();
    return a.some((t, i) => t !== b[i]);
  }, [preferredName, team, classStanding, initial]);

  const isTeamSelected = (t: string) =>
    team.some((x) => x.toLowerCase() === t.toLowerCase());

  const toggleTeam = (t: string) => {
    setTeam((prev) => {
      const lower = t.toLowerCase();
      return prev.some((x) => x.toLowerCase() === lower)
        ? prev.filter((x) => x.toLowerCase() !== lower)
        : [...prev, t];
    });
  };

  const handleCancel = () => {
    if (!initial) return;
    setPreferredName(initial.preferredName);
    setTeam(initial.team);
    setClassStanding(initial.classStanding);
    setStatus({ kind: "idle" });
  };

  const handleSave = async () => {
    if (!userInfo?.email || !initial) return;
    setStatus({ kind: "saving" });
    try {
      // ALL user-document mutations must be serialized — every backend
      // endpoint (updatePreferredName / updateStanding / addTeam / removeTeam)
      // does read-modify-write on the same document, so any parallel pair
      // races and the loser's field is overwritten.
      const initialLower = initial.team.map((t) => t.toLowerCase());
      const currentLower = team.map((t) => t.toLowerCase());
      const toAdd = team.filter(
        (t) => !initialLower.includes(t.toLowerCase()),
      );
      const toRemove = initial.team.filter(
        (t) => !currentLower.includes(t.toLowerCase()),
      );

      const ops: Array<() => Promise<any>> = [];
      if (preferredName.trim() !== initial.preferredName) {
        ops.push(() =>
          updatePreferredName(userInfo.email, preferredName.trim() || " "),
        );
      }
      if (classStanding && classStanding !== initial.classStanding) {
        ops.push(() => updateUserStanding(userInfo.email, classStanding));
      }
      for (const t of toAdd) {
        ops.push(() => addUserTeam(userInfo.email, t));
      }
      for (const t of toRemove) {
        ops.push(() => removeUserTeam(userInfo.email, t));
      }
      if (sentinelValue && team.length > 0) {
        ops.push(() => removeUserTeam(userInfo.email, sentinelValue));
      }

      for (const op of ops) {
        await op();
      }

      // Refetch (not just invalidate) so RouteGuard on the next page sees
      // the new classStanding instead of the stale cached entry.
      await queryClient.refetchQueries({ queryKey: ["users-from-class"] });

      try {
        await refreshToken();
      } catch {
        // refresh failure is non-fatal — local form state is already updated.
        // The JWT will refresh on the next 401/403 or on next login.
      }

      setInitial({
        preferredName: preferredName.trim(),
        team: [...team],
        classStanding,
      });
      if (team.length > 0) setSentinelValue(null);
      setStatus({ kind: "success" });
      router.push("/");
    } catch (err: any) {
      setStatus({
        kind: "error",
        message:
          err?.response?.data ??
          err?.message ??
          "Failed to save profile changes.",
      });
    }
  };

  if (!userInfo) {
    return <p className="p-4 sm:p-10">Loading...</p>;
  }

  const { first: firstName, last: lastName } = splitFullName(userInfo.name);
  const isStudent = userInfo.role === "student";

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full max-w-4xl">
      <div className="mb-5 sm:mb-6">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1"
          style={{ color: "#1E4B35" }}
        >
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information here
        </p>
      </div>

      {isStudent && (team.length === 0 || !classStanding) && (
        <div
          className="mb-4 rounded-lg border-2 px-4 py-3 flex items-start gap-2.5"
          style={{ borderColor: "#1E4B35", backgroundColor: "#E8F0EC" }}
        >
          <Info
            className="h-4 w-4 mt-0.5 shrink-0"
            style={{ color: "#1E4B35" }}
          />
          <div className="text-sm">
            <p className="font-semibold" style={{ color: "#1E4B35" }}>
              Finish setting up your profile
            </p>
            <p className="text-muted-foreground">
              You must select your{" "}
              <span className="font-medium">class standing</span> and at
              least one <span className="font-medium">team</span> before you
              can access your dashboard.
            </p>
          </div>
        </div>
      )}

      <Card className="w-full">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
            <div className="flex flex-col items-center shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-[#1E4B35]/10 flex items-center justify-center overflow-hidden">
                <UserIcon className="h-12 w-12 sm:h-14 sm:w-14 text-[#1E4B35]" />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Profile Picture
              </p>
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>First Name</FieldLabel>
                  <Input value={firstName} disabled readOnly />
                </Field>
                <Field>
                  <FieldLabel>Last Name</FieldLabel>
                  <Input value={lastName} disabled readOnly />
                </Field>
              </div>

              <Field>
                <FieldLabel>Preferred Name</FieldLabel>
                <Input
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Enter preferred name"
                  maxLength={80}
                />
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input value={userInfo.email} disabled readOnly />
              </Field>

              {isStudent && (
                <Field>
                  <FieldLabel>Class</FieldLabel>
                  <Input
                    value={userInfo.classID || "Not enrolled"}
                    disabled
                    readOnly
                  />
                </Field>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isStudent && (
        <>
          <div className="mt-8">
            <h2
              className="text-xl sm:text-2xl font-bold mb-3"
              style={{ color: "#1E4B35" }}
            >
              Change Team
            </h2>
            <div className="flex flex-wrap gap-3">
              {TEAMS.map((t) => {
                const selected = isTeamSelected(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTeam(t)}
                    className={cn(
                      "px-5 py-2.5 rounded-md border text-sm font-medium transition-colors",
                      selected
                        ? "bg-amber-400 border-amber-400 text-[#1E4B35]"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <h2
              className="text-xl sm:text-2xl font-bold mb-3"
              style={{ color: "#1E4B35" }}
            >
              Change Class Standing
            </h2>
            <div className="flex flex-wrap gap-3">
              {STANDINGS.map((s) => {
                const selected = classStanding === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setClassStanding(s)}
                    className={cn(
                      "px-5 py-2.5 rounded-md border text-sm font-medium transition-colors",
                      selected
                        ? "bg-amber-400 border-amber-400 text-[#1E4B35]"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {status.kind === "success" && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-700 shrink-0" />
          <p className="text-sm text-green-800">Profile updated.</p>
        </div>
      )}
      {status.kind === "error" && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
          <p className="text-sm text-red-800">{status.message}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-8">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="rounded-lg text-white border-0 px-6"
            style={{ backgroundColor: "#1E4B35" }}
            onClick={handleSave}
            disabled={
              !isDirty ||
              status.kind === "saving" ||
              isLoading ||
              (isStudent && (team.length === 0 || !classStanding))
            }
          >
            {status.kind === "saving" ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg px-6"
            onClick={handleCancel}
            disabled={!isDirty || status.kind === "saving"}
          >
            Cancel
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold cursor-pointer hover:underline"
          style={{ color: "#1E4B35" }}
          onClick={() => {
            // eslint-disable-next-line no-alert
            alert("Archive account is not yet wired up.");
          }}
        >
          <Archive className="h-4 w-4" />
          Archive Account
        </button>
      </div>
    </div>
  );
}
