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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  GraduationCap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full max-w-4xl">
      <div className="mb-4 sm:mb-5">
        <h1
          className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2.5"
          style={{ color: "#1E4B35" }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
            style={{ borderColor: "#1E4B35" }}
          >
            <UserIcon
              className="h-5 w-5"
              style={{ color: "#1E4B35" }}
              aria-hidden
            />
          </span>
          Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-[46px]">
          {userInfo.role === "student"
            ? "Update your preferred name, class standing, and team assignments. Your team determines which worklogs you contribute to each week."
            : "Update your preferred name."}
        </p>
      </div>

      {userInfo.role === "student" &&
        (team.length === 0 || !classStanding) && (
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
        <CardContent className="p-4 sm:p-6">
          <FieldGroup>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#1E4B35]/10 flex items-center justify-center shrink-0">
                <UserIcon className="h-8 w-8 sm:h-10 sm:w-10 text-[#1E4B35]" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-lg sm:text-xl font-semibold truncate">
                  {userInfo.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {userInfo.email}
                </p>
                {userInfo.classID && (
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <GraduationCap
                      className="h-3.5 w-3.5"
                      style={{ color: "#1E4B35" }}
                    />
                    <span style={{ color: "#1E4B35" }}>
                      {userInfo.classID}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldDescription>
                Your full name as registered. Contact your instructor to change
                this.
              </FieldDescription>
              <Input value={userInfo.name} disabled readOnly />
            </Field>

            <Field>
              <FieldLabel>Preferred Name</FieldLabel>
              <FieldDescription>
                What would you like to be called?
              </FieldDescription>
              <Input
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Enter preferred name"
                maxLength={80}
              />
            </Field>

            {userInfo.role === "student" && (
              <>
                <Field>
                  <FieldLabel>
                    Class Standing
                    <span className="text-red-600 ml-1">*</span>
                  </FieldLabel>
                  <FieldDescription>
                    Are you an undergraduate or graduate student?
                  </FieldDescription>
                  <div className="flex flex-wrap gap-2">
                    {STANDINGS.map((s) => {
                      const selected = classStanding === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setClassStanding(s)}
                          className={cn(
                            "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
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
                </Field>

                <Field>
                  <FieldLabel>
                    Team
                    <span className="text-red-600 ml-1">*</span>
                  </FieldLabel>
                  <FieldDescription>
                    Select all teams you contribute to. You can pick more than
                    one.
                  </FieldDescription>
                  <div className="flex flex-wrap gap-2">
                    {TEAMS.map((t) => {
                      const selected = isTeamSelected(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTeam(t)}
                          className={cn(
                            "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
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
                </Field>
              </>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {status.kind === "success" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-700 shrink-0" />
          <p className="text-sm text-green-800">Profile updated.</p>
        </div>
      )}
      {status.kind === "error" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
          <p className="text-sm text-red-800">{status.message}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        <Button
          type="button"
          className="rounded-lg text-white border-0"
          style={{ backgroundColor: "#1E4B35" }}
          onClick={handleSave}
          disabled={
            !isDirty ||
            status.kind === "saving" ||
            isLoading ||
            (userInfo.role === "student" &&
              (team.length === 0 || !classStanding))
          }
        >
          {status.kind === "saving" ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          onClick={handleCancel}
          disabled={!isDirty || status.kind === "saving"}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
