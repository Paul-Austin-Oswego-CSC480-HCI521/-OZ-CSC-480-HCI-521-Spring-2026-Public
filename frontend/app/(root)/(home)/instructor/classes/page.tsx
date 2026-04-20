"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import {
  archiveClass,
  createClass,
  getClasses,
  StudentClass,
  ClassUser,
} from "@/components/custom/utils/api_utils/req/class";
import { getUsersFromClass } from "@/components/custom/utils/api_utils/req/req";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Users,
  LayoutGrid,
  Search,
  Settings,
  UserPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  CheckCircle2,
  CircleDot,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import StudentSearchPicker from "@/components/custom/instructor/classes/StudentSearchPicker";

const BRAND_GREEN = "#1E4B35";
const BRAND_GREEN_TINT = "#E8F0EC";
const BRAND_AMBER_TINT = "#FCEBD3";
const PAGE_SIZE = 10;

type SplitName = { first: string; last: string };

function splitName(full: string | undefined): SplitName {
  if (!full) return { first: "", last: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function teamChipClasses(team: string): string {
  const t = team.toLowerCase();
  if (t.includes("usab")) return "bg-emerald-100 text-emerald-800";
  if (t.includes("require")) return "bg-green-100 text-green-800";
  if (t.includes("qa")) return "bg-amber-100 text-amber-800";
  if (t.includes("front")) return "bg-orange-100 text-orange-800";
  if (t.includes("back")) return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-800";
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  ) : (
    <CircleDot className="h-4 w-4 text-amber-500" />
  );
}

export default function ClassesPage() {
  const userInfo = useAtomValue(userAtom);
  const router = useRouter();
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteStudentsOpen, setInviteStudentsOpen] = useState(false);
  const [selectedClassID, setSelectedClassID] = useState<string | null>(null);
  const [classID, setClassID] = useState("");
  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [semsesterEndDate, setSemsesterEndDate] = useState("");
  const [studendAccessEndDate, setStudendAccessEndDate] = useState("");

  useEffect(() => setMounted(true), []);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    enabled: userInfo?.role === "instructor",
  });

  const classList: StudentClass[] = classes ?? [];

  const defaultClass: StudentClass | undefined = useMemo(
    () => classList.find((c) => !c.isArchived) ?? classList[0],
    [classList],
  );

  useEffect(() => {
    if (!selectedClassID && defaultClass?.classID) {
      setSelectedClassID(defaultClass.classID);
    }
  }, [defaultClass?.classID, selectedClassID]);

  const activeClass: StudentClass | undefined = useMemo(
    () =>
      classList.find((c) => c.classID === selectedClassID) ?? defaultClass,
    [classList, selectedClassID, defaultClass],
  );

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users-from-class", activeClass?.classID],
    queryFn: () => getUsersFromClass(activeClass!.classID),
    enabled: !!activeClass?.classID && userInfo?.role === "instructor",
  });

  const list: ClassUser[] = (users ?? []) as ClassUser[];

  const matchesSearch = (u: ClassUser) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    if (u.name?.toLowerCase().includes(q)) return true;
    if (u.email?.toLowerCase().includes(q)) return true;
    if ((u.team ?? []).some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  };

  const instructors = list.filter((u) => u.role === "instructor").filter(matchesSearch);
  const students = list.filter((u) => u.role === "student").filter(matchesSearch);

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedStudents = students.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmed = classID.trim();
      const created = await createClass({
        classID: trimmed,
        semesterStartDate,
        semsesterEndDate,
        studendAccessEndDate,
        isArchived: false,
      });
      if (!created) return null;
      const toArchive = classList.filter(
        (c) => !c.isArchived && c.classID !== trimmed,
      );
      if (toArchive.length > 0) {
        await Promise.all(toArchive.map((c) => archiveClass(c.classID)));
      }
      return created;
    },
    onSuccess: (data) => {
      if (!data) {
        toast.error(`Class "${classID}" already exists`);
        return;
      }
      qc.invalidateQueries({ queryKey: ["classes"] });
      setSelectedClassID(classID.trim());
      toast.success(`Created class ${classID}`);
      setCreateOpen(false);
      setSettingsOpen(false);
      setClassID("");
      setSemesterStartDate("");
      setSemsesterEndDate("");
      setStudendAccessEndDate("");
    },
    onError: (e: Error) => toast.error(e?.message ?? "Failed to create class"),
  });

  if (!mounted || !userInfo) return <p className="p-4 sm:p-10">Loading...</p>;
  if (userInfo.role !== "instructor") {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }

  const canSubmit =
    !!classID.trim() &&
    !!semesterStartDate &&
    !!semsesterEndDate &&
    !!studendAccessEndDate;

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full">
      <div className="mb-4 sm:mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2.5"
            style={{ color: BRAND_GREEN }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
              style={{ borderColor: BRAND_GREEN }}
            >
              <Users className="h-5 w-5" style={{ color: BRAND_GREEN }} aria-hidden />
            </span>
            Manage Class
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-[46px]">
            Manage and organize your academic roaster and instructor teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={activeClass?.classID ?? ""}
            onValueChange={(v) => {
              setSelectedClassID(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="min-w-[180px] border-2 bg-white cursor-pointer"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
            >
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classList.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No classes yet
                </div>
              )}
              {classList.map((c) => (
                <SelectItem key={c.classID} value={c.classID}>
                  {c.classID}
                  {c.isArchived ? " (archived)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            className="gap-2 cursor-pointer border-2"
            style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
          >
            <Settings className="h-4 w-4" />
            Class Settings
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students or teams..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9 bg-white"
        />
      </div>

      <Card className="mb-4 overflow-hidden p-0 gap-0">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: BRAND_GREEN_TINT }}
        >
          <div
            className="flex items-center gap-2 font-semibold"
            style={{ color: BRAND_GREEN }}
          >
            <Users className="h-4 w-4" />
            Instructors
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 cursor-pointer text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_GREEN }}
              onClick={() => toast.message("Invite Instructor (placeholder)")}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Instructor
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 cursor-pointer border-2"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
              onClick={() => toast.message("Actions (placeholder)")}
            >
              Actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left w-10">
                  <input type="checkbox" disabled className="cursor-not-allowed" />
                </th>
                <th className="px-4 py-2.5 text-left">Last Name</th>
                <th className="px-4 py-2.5 text-left">First Name</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Loading instructors...
                  </td>
                </tr>
              )}
              {usersError && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                    Failed to load instructors
                  </td>
                </tr>
              )}
              {!usersLoading && !usersError && instructors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No instructors found
                  </td>
                </tr>
              )}
              {instructors.map((u) => {
                const { first, last } = splitName(u.name);
                const isYou = u.email === userInfo.email;
                return (
                  <tr key={u.email} className="border-t">
                    <td className="px-4 py-3">
                      <input type="checkbox" disabled className="cursor-not-allowed" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot ok />
                        <span className="font-medium">{last || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{first || "—"}</span>
                        {isYou && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => toast.message("Row actions (placeholder)")}
                        aria-label="Row actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mb-4 overflow-hidden p-0 gap-0">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: BRAND_AMBER_TINT }}
        >
          <div
            className="flex items-center gap-2 font-semibold"
            style={{ color: BRAND_GREEN }}
          >
            <LayoutGrid className="h-4 w-4" />
            Class Roster
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!activeClass?.classID}
              className="gap-1.5 cursor-pointer text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_GREEN }}
              onClick={() => setInviteStudentsOpen(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Students
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 cursor-pointer border-2"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
              onClick={() => toast.message("Actions (placeholder)")}
            >
              Actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-amber-50/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left w-10">
                  <input type="checkbox" disabled className="cursor-not-allowed" />
                </th>
                <th className="px-4 py-2.5 text-left">Last Name</th>
                <th className="px-4 py-2.5 text-left">First Name</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-left">Class</th>
                <th className="px-4 py-2.5 text-left">Teams</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    Loading students...
                  </td>
                </tr>
              )}
              {usersError && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-red-600">
                    Failed to load students
                  </td>
                </tr>
              )}
              {!usersLoading && !usersError && students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No students found
                  </td>
                </tr>
              )}
              {pagedStudents.map((u) => {
                const { first, last } = splitName(u.name);
                const teams = (u.team ?? []).filter(
                  (t) => t && t.toLowerCase() !== "unassigned",
                );
                const ok = teams.length > 0;
                return (
                  <tr
                    key={u.email}
                    className="border-t cursor-pointer hover:bg-muted/40"
                    onClick={() =>
                      router.push(
                        `/instructor/students/${encodeURIComponent(u.email)}`,
                      )
                    }
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input type="checkbox" disabled className="cursor-not-allowed" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot ok={ok} />
                        <span className="font-medium">{last || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{first || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.classStanding ? (
                        <span className="text-xs whitespace-pre-line">
                          {u.classStanding.replace(" ", "\n")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {teams.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {teams.map((t) => (
                          <span
                            key={t}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded ${teamChipClasses(t)}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => toast.message("Row actions (placeholder)")}
                        aria-label="Row actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {students.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {pagedStudents.length} of {students.length} students
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 flex items-center justify-center rounded border text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  const active = n === safePage;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-7 w-7 flex items-center justify-center rounded text-sm cursor-pointer ${
                        active
                          ? "text-white"
                          : "border hover:bg-muted"
                      }`}
                      style={
                        active
                          ? { backgroundColor: BRAND_GREEN }
                          : undefined
                      }
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 w-7 flex items-center justify-center rounded border text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0 gap-0">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-muted/40">
              <div
                className="flex items-center gap-2 font-semibold"
                style={{ color: BRAND_GREEN }}
              >
                <Users className="h-4 w-4" />
                Inactive Students
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-6 text-sm text-muted-foreground border-t">
              No inactive students.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AlertDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: BRAND_GREEN }}>
              Class Settings
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeClass
                ? `Active class: ${activeClass.classID}`
                : "No active class yet."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 text-sm">
            {activeClass && (
              <div className="space-y-1 rounded border p-3 bg-muted/30">
                <p>
                  <span className="text-muted-foreground">Semester: </span>
                  {activeClass.semesterStartDate || "—"} —{" "}
                  {activeClass.semsesterEndDate || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Student access ends: </span>
                  {activeClass.studendAccessEndDate || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Students enrolled: </span>
                  {students.length + instructors.length}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full gap-2 cursor-pointer border-2"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
              onClick={() => {
                setSettingsOpen(false);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create New Class
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={inviteStudentsOpen} onOpenChange={setInviteStudentsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: BRAND_GREEN }}>
              Invite Students
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeClass
                ? `Add students to ${activeClass.classID}.`
                : "Pick a class first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {activeClass?.classID && (
            <StudentSearchPicker
              classID={activeClass.classID}
              existingEmails={list.map((u) => u.email)}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Done</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: BRAND_GREEN }}>
              Create Class
            </AlertDialogTitle>
            <AlertDialogDescription>
              Set up a new class. The Class ID becomes the database name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Class ID</Label>
              <Input
                placeholder="e.g. CSC480-Sp2026"
                value={classID}
                onChange={(e) => setClassID(e.target.value)}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Semester Start</Label>
                <Input
                  type="date"
                  value={semesterStartDate}
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Semester End</Label>
                <Input
                  type="date"
                  value={semsesterEndDate}
                  onChange={(e) => setSemsesterEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Student Access End</Label>
                <Input
                  type="date"
                  value={studendAccessEndDate}
                  onChange={(e) => setStudendAccessEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <Button
              disabled={!canSubmit || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="cursor-pointer text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
