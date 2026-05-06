"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isInstructorRole, userAtom } from "@/components/custom/utils/context/state";
import {
  archiveClass,
  createClass,
  demoteFromInstructor,
  getAllUsers,
  getClasses,
  unenrollUser,
  updateClass,
  StudentClass,
  ClassUser,
} from "@/components/custom/utils/api_utils/req/class";
import {
  addUserTeam,
  getUsersFromClass,
  refreshToken,
  removeUserTeam,
  updateUserStanding,
} from "@/components/custom/utils/api_utils/req/req";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UserSearch,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  CheckCircle2,
  CircleDot,
  Plus,
  Archive,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import StudentSearchPicker from "@/components/custom/instructor/classes/StudentSearchPicker";
import InstructorSearchPicker from "@/components/custom/instructor/classes/InstructorSearchPicker";
import { fmtDate } from "@/components/custom/utils/func/formatDate";

const BRAND_GREEN = "#1E4B35";
const BRAND_GREEN_TINT = "#E8F0EC";
const BRAND_AMBER_TINT = "#FCEBD3";
const PAGE_SIZE = 10;

const TEAMS = [
  "Requirements",
  "Usability",
  "Front-End",
  "Back-End",
  "Quality Assurance",
] as const;
const STANDINGS = ["Undergraduate", "Graduate"] as const;

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
  const [inviteInstructorsOpen, setInviteInstructorsOpen] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [openInactiveMenu, setOpenInactiveMenu] = useState<string | null>(null);
  const [inactiveMenuAnchor, setInactiveMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [openInstructorMenu, setOpenInstructorMenu] = useState<string | null>(null);
  const [instructorMenuAnchor, setInstructorMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<ClassUser | null>(null);
  const [coInstructorToRemove, setCoInstructorToRemove] =
    useState<ClassUser | null>(null);
  const [studentToManage, setStudentToManage] = useState<ClassUser | null>(null);
  const [manageTeams, setManageTeams] = useState<string[]>([]);
  const [manageStanding, setManageStanding] = useState<string>("");
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editAccessEndDate, setEditAccessEndDate] = useState("");

  const closeRowMenu = () => {
    setOpenRowMenu(null);
    setMenuAnchor(null);
  };

  const openRowMenuFor = (email: string, e: React.MouseEvent<HTMLElement>) => {
    if (openRowMenu === email) {
      closeRowMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenRowMenu(email);
  };

  const closeInactiveMenu = () => {
    setOpenInactiveMenu(null);
    setInactiveMenuAnchor(null);
  };
  const openInactiveMenuFor = (
    email: string,
    e: React.MouseEvent<HTMLElement>,
  ) => {
    if (openInactiveMenu === email) {
      closeInactiveMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setInactiveMenuAnchor({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenInactiveMenu(email);
  };

  const closeInstructorMenu = () => {
    setOpenInstructorMenu(null);
    setInstructorMenuAnchor(null);
  };
  const openInstructorMenuFor = (
    email: string,
    e: React.MouseEvent<HTMLElement>,
  ) => {
    if (openInstructorMenu === email) {
      closeInstructorMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setInstructorMenuAnchor({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenInstructorMenu(email);
  };
  const [selectedClassID, setSelectedClassID] = useState<string | null>(null);
  const [classID, setClassID] = useState("");
  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [semsesterEndDate, setSemsesterEndDate] = useState("");
  const [studendAccessEndDate, setStudendAccessEndDate] = useState("");

  useEffect(() => setMounted(true), []);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    enabled: isInstructorRole(userInfo?.role),
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
    enabled: isInstructorRole(userInfo?.role),
  });

  const classList: StudentClass[] = (classes ?? []).filter(
    (c) => c.classID === userInfo?.classID && !c.isArchived,
  );

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

  useEffect(() => {
    if (studentToManage) {
      setManageTeams(
        (studentToManage.team ?? []).filter(
          (t) => t && t.toLowerCase() !== "unassigned",
        ),
      );
      setManageStanding(studentToManage.classStanding ?? "");
    }
  }, [studentToManage]);

  useEffect(() => {
    if (settingsOpen && activeClass) {
      // Backend may serialize dates with a timestamp (e.g. "2026-01-19T00:00:00Z");
      // <input type="date"> requires exactly "YYYY-MM-DD", so strip anything past 10 chars.
      const toIsoDate = (v: string | undefined | null) =>
        v ? String(v).slice(0, 10) : "";
      setEditStartDate(toIsoDate(activeClass.semesterStartDate));
      setEditEndDate(toIsoDate(activeClass.semsesterEndDate));
      setEditAccessEndDate(toIsoDate(activeClass.studendAccessEndDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, activeClass?.classID]);

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users-from-class", activeClass?.classID],
    queryFn: () => getUsersFromClass(activeClass!.classID),
    enabled: !!activeClass?.classID && isInstructorRole(userInfo?.role),
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

  const instructors = list
    .filter((u) => u.role === "instructor" || u.role === "co-instructor")
    .filter(matchesSearch);
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
      const created = await createClass(
        {
          classID: trimmed,
          semesterStartDate,
          semsesterEndDate,
          studendAccessEndDate,
          isArchived: false,
        },
        userInfo!.email,
      );
      if (!created) return null;
      const toArchive = classList.filter(
        (c) => !c.isArchived && c.classID !== trimmed,
      );
      if (toArchive.length > 0) {
        const rosters = await Promise.all(
          toArchive.map((c) =>
            getUsersFromClass(c.classID).catch(() => []) as Promise<ClassUser[]>,
          ),
        );
        const emailsToUnenroll = Array.from(
          new Set(
            rosters
              .flat()
              .filter((u) => u?.role === "student" && u?.email)
              .map((u) => u.email),
          ),
        );
        await Promise.all(emailsToUnenroll.map((email) => unenrollUser(email)));
        await Promise.all(toArchive.map((c) => archiveClass(c.classID)));
      }
      return created;
    },
    onSuccess: async (data) => {
      if (!data) {
        toast.error(`Class "${classID}" already exists`);
        return;
      }
      // Refresh JWT so the creator's classID reflects the newly created class —
      // /instructor filters activeClass by userInfo.classID, so a stale token
      // would briefly show "No active class" right after creation.
      await refreshToken().catch(() => {});
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["users-from-class"] });
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

  const archiveMutation = useMutation({
    mutationFn: async (classID: string) => {
      const roster = ((await getUsersFromClass(classID).catch(() => [])) ??
        []) as ClassUser[];
      const studentEmails = roster
        .filter((u) => u?.role === "student" && u?.email)
        .map((u) => u.email);
      await Promise.all(studentEmails.map((email) => unenrollUser(email)));
      await archiveClass(classID);
    },
    onSuccess: async () => {
      await refreshToken().catch(() => {});
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["users-from-class"] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Class archived.");
      setArchiveConfirmOpen(false);
      setSettingsOpen(false);
      setSelectedClassID(null);
    },
    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to archive class"),
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (vars: {
      email: string;
      originalTeams: string[];
      newTeams: string[];
      originalStanding: string;
      newStanding: string;
    }) => {
      const teamsToAdd = vars.newTeams.filter(
        (t) => !vars.originalTeams.includes(t),
      );
      const teamsToRemove = vars.originalTeams.filter(
        (t) => !vars.newTeams.includes(t),
      );
      await Promise.all([
        ...teamsToRemove.map((t) => removeUserTeam(vars.email, t)),
        ...teamsToAdd.map((t) => addUserTeam(vars.email, t)),
        vars.newStanding !== vars.originalStanding
          ? updateUserStanding(vars.email, vars.newStanding)
          : Promise.resolve(),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-from-class", activeClass?.classID] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Student profile saved.");
      setStudentToManage(null);
    },
    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to save student profile"),
  });

  const updateClassMutation = useMutation({
    mutationFn: (vars: {
      classID: string;
      updates: Partial<
        Pick<
          StudentClass,
          "semesterStartDate" | "semsesterEndDate" | "studendAccessEndDate"
        >
      >;
    }) => updateClass(vars.classID, vars.updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class settings saved.");
      setSettingsOpen(false);
    },
    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to save class settings"),
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: (email: string) => unenrollUser(email),
    onSuccess: (_data, email) => {
      qc.invalidateQueries({ queryKey: ["users-from-class", activeClass?.classID] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(`Removed ${email} from class.`);
      setStudentToRemove(null);
    },
    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to remove student"),
  });

  const demoteMutation = useMutation({
    mutationFn: (email: string) => demoteFromInstructor(email),
    onSuccess: (_data, email) => {
      qc.invalidateQueries({ queryKey: ["users-from-class", activeClass?.classID] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(`Removed ${email} from instructors.`);
    },
    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to remove instructor"),
  });

  const removeCoInstructorMutation = useMutation({
    mutationFn: (email: string) => unenrollUser(email),
    onSuccess: (_data, email) => {
      qc.invalidateQueries({ queryKey: ["users-from-class", activeClass?.classID] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success(`Removed ${email} from class.`);
      setCoInstructorToRemove(null);
    },
    onError: (e: Error) =>
      toast.error(e?.message ?? "Failed to remove co-instructor"),
  });

  if (!mounted || !userInfo) return <p className="p-4 sm:p-10">Loading...</p>;
  if (!isInstructorRole(userInfo.role)) {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }
  if (userInfo.role === "co-instructor" && !activeClass) {
    return (
      <div className="p-4 sm:p-6 md:p-10">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No active class. Ask the primary instructor to add you as a co-instructor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classIDValid =
    !!classID.trim() && !/\s/.test(classID);
  const endAfterStart =
    !semesterStartDate ||
    !semsesterEndDate ||
    semsesterEndDate >= semesterStartDate;
  const accessAfterEnd =
    !semsesterEndDate ||
    !studendAccessEndDate ||
    studendAccessEndDate >= semsesterEndDate;
  const canSubmit =
    classIDValid &&
    !!semesterStartDate &&
    !!semsesterEndDate &&
    !!studendAccessEndDate &&
    endAfterStart &&
    accessAfterEnd;

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
        <div className="flex flex-col items-end gap-3 shrink-0 self-start">
          {activeClass?.classID && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Active Class</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">
                {activeClass.classID}
              </p>
            </div>
          )}
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
              disabled={!activeClass?.classID}
              className="gap-1.5 cursor-pointer text-white hover:opacity-90 disabled:cursor-not-allowed"
              style={{ backgroundColor: BRAND_GREEN }}
              onClick={() => setInviteInstructorsOpen(true)}
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
                const pref = u.preferredName?.trim()?.split(/\s+/)[0] ?? "";
                const isYou = u.email === userInfo.email;
                const isPrimary = u.role === "instructor";
                const canDemote = !isPrimary && !isYou;
                const menuOpen = openRowMenu === u.email;
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
                        <span>
                          {first || "—"}
                          {pref && pref.toLowerCase() !== first.toLowerCase() && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({pref})
                            </span>
                          )}
                        </span>
                        {isYou && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          isPrimary
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isPrimary ? "Instructor" : "Co-Instructor"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={(e) => openInstructorMenuFor(u.email, e)}
                        disabled={!canDemote}
                        title={
                          isPrimary
                            ? "Primary instructor cannot be demoted here"
                            : isYou
                              ? "You cannot demote yourself"
                              : undefined
                        }
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
                  <td colSpan={7} className="px-6 py-12">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <UserSearch className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {search.trim()
                          ? "No matches"
                          : "No Students in this class!"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {search.trim()
                          ? "Try a different search."
                          : "Invite students to get started with the tracking portal and begin managing their work logs."}
                      </p>
                      {!search.trim() && (
                        <Button
                          className="gap-2 cursor-pointer text-zinc-900 hover:opacity-90 mt-1"
                          style={{ backgroundColor: "#f59e0b" }}
                          onClick={() => setInviteStudentsOpen(true)}
                          disabled={!activeClass?.classID}
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite Students
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {pagedStudents.map((u) => {
                const { first, last } = splitName(u.name);
                const pref = u.preferredName?.trim()?.split(/\s+/)[0] ?? "";
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
                        `/instructor/students/${encodeURIComponent(u.email)}?from=classes`,
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
                    <td className="px-4 py-3">
                      {first || "—"}
                      {pref && pref.toLowerCase() !== first.toLowerCase() && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({pref})
                        </span>
                      )}
                    </td>
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
                        onClick={(e) => openRowMenuFor(u.email, e)}
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
            {(activeClass?.inactiveStudents ?? []).length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground border-t">
                No inactive students.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border-t">
                <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5 w-10"></th>
                    <th className="px-4 py-2.5 text-left">Last Name</th>
                    <th className="px-4 py-2.5 text-left">First Name</th>
                    <th className="px-4 py-2.5 text-left">Email</th>
                    <th className="px-4 py-2.5 text-left">Class</th>
                    <th className="px-4 py-2.5 text-left">Team</th>
                    <th className="px-4 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(activeClass?.inactiveStudents ?? []).map((s) => {
                    const { first, last } = splitName(s.name);
                    const teams = (s.team ?? []).filter(
                      (t) => t && t.toLowerCase() !== "unassigned",
                    );
                    return (
                      <tr key={s.email} className="border-t">
                        <td className="px-4 py-3">
                          <X className="h-4 w-4 text-red-600" />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {last || "—"}
                        </td>
                        <td className="px-4 py-3">{first || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.email}
                        </td>
                        <td className="px-4 py-3">
                          {s.classStanding ? (
                            <span className="text-xs whitespace-pre-line">
                              {s.classStanding.replace(" ", "\n")}
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
                        <td className="px-4 py-3">
                          <button
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={(e) => openInactiveMenuFor(s.email, e)}
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
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {openRowMenu &&
        menuAnchor &&
        pagedStudents.some((s) => s.email === openRowMenu) &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={closeRowMenu}
            />
            <div
              className="fixed z-50 w-44 rounded-md border bg-white shadow-lg py-1"
              style={{ top: menuAnchor.top, right: menuAnchor.right }}
            >
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => {
                  const email = openRowMenu;
                  closeRowMenu();
                  router.push(
                    `/instructor/students/${encodeURIComponent(email)}?from=classes`,
                  );
                }}
              >
                View all worklogs
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => {
                  const target = pagedStudents.find(
                    (s) => s.email === openRowMenu,
                  );
                  closeRowMenu();
                  if (target) setStudentToManage(target);
                }}
              >
                Manage student
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700 cursor-pointer"
                onClick={() => {
                  const target = pagedStudents.find(
                    (s) => s.email === openRowMenu,
                  );
                  closeRowMenu();
                  if (target) setStudentToRemove(target);
                }}
              >
                Remove from class
              </button>
            </div>
          </>,
          document.body,
        )}

      {openInstructorMenu &&
        instructorMenuAnchor &&
        list.some(
          (u) =>
            u.email === openInstructorMenu &&
            (u.role === "instructor" || u.role === "co-instructor"),
        ) &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={closeInstructorMenu}
            />
            <div
              className="fixed z-50 w-44 rounded-md border bg-white shadow-lg py-1"
              style={{
                top: instructorMenuAnchor.top,
                right: instructorMenuAnchor.right,
              }}
            >
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700 cursor-pointer disabled:opacity-50"
                disabled={removeCoInstructorMutation.isPending}
                onClick={() => {
                  const target = list.find(
                    (u) => u.email === openInstructorMenu,
                  );
                  closeInstructorMenu();
                  if (target) setCoInstructorToRemove(target);
                }}
              >
                Remove from class
              </button>
            </div>
          </>,
          document.body,
        )}

      {openInactiveMenu &&
        inactiveMenuAnchor &&
        (activeClass?.inactiveStudents ?? []).some(
          (s) => s.email === openInactiveMenu,
        ) &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={closeInactiveMenu} />
            <div
              className="fixed z-50 w-44 rounded-md border bg-white shadow-lg py-1"
              style={{
                top: inactiveMenuAnchor.top,
                right: inactiveMenuAnchor.right,
              }}
            >
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => {
                  const email = openInactiveMenu;
                  const cls = activeClass?.classID;
                  closeInactiveMenu();
                  if (email) {
                    router.push(
                      `/instructor/students/${encodeURIComponent(email)}?from=classes${cls ? `&classID=${encodeURIComponent(cls)}` : ""}`,
                    );
                  }
                }}
              >
                View all worklogs
              </button>
            </div>
          </>,
          document.body,
        )}

      <AlertDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <AlertDialogContent className="sm:max-w-2xl">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSettingsOpen(false)}
            className="absolute right-4 top-4 text-red-600 hover:text-red-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-2xl sm:text-3xl"
              style={{ color: BRAND_GREEN }}
            >
              Class Settings
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeClass
                ? `Editing ${activeClass.classID}.`
                : "No active class yet."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {activeClass ? (
            (() => {
              const endAfterStart =
                !editStartDate ||
                !editEndDate ||
                editEndDate >= editStartDate;
              const accessAfterEnd =
                !editEndDate ||
                !editAccessEndDate ||
                editAccessEndDate >= editEndDate;
              const hasChanges =
                editStartDate !== (activeClass.semesterStartDate ?? "") ||
                editEndDate !== (activeClass.semsesterEndDate ?? "") ||
                editAccessEndDate !==
                  (activeClass.studendAccessEndDate ?? "");
              const canSave =
                userInfo.role === "instructor" &&
                hasChanges &&
                endAfterStart &&
                accessAfterEnd &&
                !!editStartDate &&
                !!editEndDate &&
                !!editAccessEndDate;
              const isPrimary = userInfo.role === "instructor";
              return (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input
                        value={activeClass.classID}
                        readOnly
                        disabled
                        className="bg-muted/40 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Student Access End Date</Label>
                      <Input
                        type="date"
                        value={editAccessEndDate}
                        min={editEndDate || undefined}
                        disabled={!isPrimary}
                        onChange={(e) =>
                          setEditAccessEndDate(e.target.value)
                        }
                      />
                      {!accessAfterEnd && (
                        <p className="text-xs text-red-600">
                          Student access must end on or after the semester
                          ends.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Semester Start Date</Label>
                      <Input
                        type="date"
                        value={editStartDate}
                        disabled={!isPrimary}
                        onChange={(e) => setEditStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Semester End Date</Label>
                      <Input
                        type="date"
                        value={editEndDate}
                        min={editStartDate || undefined}
                        disabled={!isPrimary}
                        onChange={(e) => setEditEndDate(e.target.value)}
                      />
                      {!endAfterStart && (
                        <p className="text-xs text-red-600">
                          End must be on or after the start date.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4">
                    <div className="flex items-center gap-2">
                      <AlertDialogCancel
                        className="cursor-pointer mt-0"
                        disabled={updateClassMutation.isPending}
                      >
                        Cancel
                      </AlertDialogCancel>
                      {isPrimary && (
                        <Button
                          className="cursor-pointer text-zinc-900 hover:opacity-90"
                          style={{ backgroundColor: "#f59e0b" }}
                          disabled={!canSave || updateClassMutation.isPending}
                          onClick={() => {
                            updateClassMutation.mutate({
                              classID: activeClass.classID,
                              updates: {
                                semesterStartDate: editStartDate,
                                semsesterEndDate: editEndDate,
                                studendAccessEndDate: editAccessEndDate,
                              },
                            });
                          }}
                        >
                          {updateClassMutation.isPending
                            ? "Saving..."
                            : "Save Changes"}
                        </Button>
                      )}
                    </div>
                    {isPrimary && (
                      <Button
                        className="cursor-pointer text-white hover:opacity-90"
                        style={{ backgroundColor: BRAND_GREEN }}
                        onClick={() => setArchiveConfirmOpen(true)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Class
                      </Button>
                    )}
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <div className="text-sm text-muted-foreground py-2">
                You don&apos;t have an active class yet.
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Close
                </AlertDialogCancel>
                {userInfo.role === "instructor" && (
                  <Button
                    className="gap-2 cursor-pointer text-white hover:opacity-90"
                    style={{ backgroundColor: BRAND_GREEN }}
                    onClick={() => {
                      setSettingsOpen(false);
                      setCreateOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Create New Class
                  </Button>
                )}
              </AlertDialogFooter>
            </>
          )}
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

      <AlertDialog
        open={archiveConfirmOpen}
        onOpenChange={(open) => !open && setArchiveConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: BRAND_GREEN }}>
              Archive class
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeClass ? (
                <>
                  Archive <span className="font-medium">{activeClass.classID}</span>?
                  All enrolled students will be unenrolled and the class will move
                  to Archived Classes. This cannot be undone from here.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={archiveMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="cursor-pointer"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (activeClass?.classID) {
                  archiveMutation.mutate(activeClass.classID);
                }
              }}
            >
              {archiveMutation.isPending ? "Archiving..." : "Archive"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!studentToManage}
        onOpenChange={(open) => !open && setStudentToManage(null)}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setStudentToManage(null)}
            className="absolute right-4 top-4 text-red-600 hover:text-red-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-2xl"
              style={{ color: BRAND_GREEN }}
            >
              Manage Student
            </AlertDialogTitle>
            <AlertDialogDescription>
              Edit Student&apos;s Profile
            </AlertDialogDescription>
          </AlertDialogHeader>

          {studentToManage && (
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate">
                    {studentToManage.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {studentToManage.email}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Current Teams</p>
                <div className="flex flex-wrap gap-2">
                  {TEAMS.map((t) => {
                    const selected = manageTeams.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setManageTeams((prev) =>
                            selected
                              ? prev.filter((x) => x !== t)
                              : [...prev, t],
                          )
                        }
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium cursor-pointer transition-colors ${
                          selected
                            ? "bg-amber-400 border-amber-400 text-[#1E4B35]"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Class Standing</p>
                <div className="flex flex-wrap gap-2">
                  {STANDINGS.map((s) => {
                    const selected = manageStanding === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setManageStanding(s)}
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium cursor-pointer transition-colors ${
                          selected
                            ? "bg-amber-400 border-amber-400 text-[#1E4B35]"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="sm:justify-start sm:gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={updateStudentMutation.isPending}
              onClick={() => {
                const target = studentToManage;
                if (target) {
                  setStudentToManage(null);
                  setStudentToRemove(target);
                }
              }}
            >
              Remove Student
            </Button>
            <Button
              className="cursor-pointer text-white hover:opacity-90"
              style={{ backgroundColor: BRAND_GREEN }}
              disabled={updateStudentMutation.isPending}
              onClick={() => {
                if (!studentToManage) return;
                const originalTeams = (studentToManage.team ?? []).filter(
                  (t) => t && t.toLowerCase() !== "unassigned",
                );
                updateStudentMutation.mutate({
                  email: studentToManage.email,
                  originalTeams,
                  newTeams: manageTeams,
                  originalStanding: studentToManage.classStanding ?? "",
                  newStanding: manageStanding,
                });
              }}
            >
              {updateStudentMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!coInstructorToRemove}
        onOpenChange={(open) => !open && setCoInstructorToRemove(null)}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl font-bold leading-snug">
              {coInstructorToRemove ? (
                <>
                  Are you sure you want to remove {coInstructorToRemove.name} from{" "}
                  {activeClass?.classID}?
                </>
              ) : null}
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Confirm removal of co-instructor from class.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: "#E8F0EC" }}
          >
            <Info
              className="h-5 w-5 shrink-0 mt-0.5"
              style={{ color: BRAND_GREEN }}
            />
            <p className="text-sm">
              They will be removed from the class. They can be re-added later.
            </p>
          </div>

          <AlertDialogFooter className="sm:justify-center sm:gap-3 pt-2">
            <Button
              variant="outline"
              className="cursor-pointer border-2"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
              disabled={removeCoInstructorMutation.isPending}
              onClick={() => {
                if (coInstructorToRemove) {
                  removeCoInstructorMutation.mutate(coInstructorToRemove.email);
                }
              }}
            >
              {removeCoInstructorMutation.isPending
                ? "Removing..."
                : "Yes, Remove Co-Instructor"}
            </Button>
            <AlertDialogCancel
              className="cursor-pointer text-white hover:opacity-90 mt-0 border-0"
              style={{ backgroundColor: BRAND_GREEN }}
              disabled={removeCoInstructorMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!studentToRemove}
        onOpenChange={(open) => !open && setStudentToRemove(null)}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl font-bold leading-snug">
              {studentToRemove ? (
                <>
                  Are you sure you want to remove {studentToRemove.name} from{" "}
                  {activeClass?.classID}?
                </>
              ) : null}
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Confirm removal of student from class.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: "#E8F0EC" }}
          >
            <Info
              className="h-5 w-5 shrink-0 mt-0.5"
              style={{ color: BRAND_GREEN }}
            />
            <p className="text-sm">
              This student will be moved to the inactive students list and can
              be re-added at any time.
            </p>
          </div>

          <AlertDialogFooter className="sm:justify-center sm:gap-3 pt-2">
            <Button
              variant="outline"
              className="cursor-pointer border-2"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
              disabled={unenrollStudentMutation.isPending}
              onClick={() => {
                if (studentToRemove) {
                  unenrollStudentMutation.mutate(studentToRemove.email);
                }
              }}
            >
              {unenrollStudentMutation.isPending
                ? "Removing..."
                : "Yes, Remove Student"}
            </Button>
            <AlertDialogCancel
              className="cursor-pointer text-white hover:opacity-90 mt-0 border-0"
              style={{ backgroundColor: BRAND_GREEN }}
              disabled={unenrollStudentMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={inviteInstructorsOpen}
        onOpenChange={setInviteInstructorsOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: BRAND_GREEN }}>
              Invite Co-Instructor
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeClass
                ? `Add co-instructors to ${activeClass.classID}.`
                : "Pick a class first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {activeClass?.classID && (
            <InstructorSearchPicker
              classID={activeClass.classID}
              classUsers={list}
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
                onChange={(e) => setClassID(e.target.value.replace(/\s+/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
              />
              <p className="text-xs text-muted-foreground">
                No spaces allowed. This becomes the database name.
              </p>
              {classID.length > 0 && !classIDValid && (
                <p className="text-xs text-red-600">
                  Class ID cannot contain spaces.
                </p>
              )}
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
                  min={semesterStartDate || undefined}
                  onChange={(e) => setSemsesterEndDate(e.target.value)}
                />
                {!endAfterStart && (
                  <p className="text-xs text-red-600">
                    End must be on or after start date.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Student Access End</Label>
                <Input
                  type="date"
                  value={studendAccessEndDate}
                  min={semsesterEndDate || undefined}
                  onChange={(e) => setStudendAccessEndDate(e.target.value)}
                />
                {!accessAfterEnd && (
                  <p className="text-xs text-red-600">
                    Student access must end on or after the semester ends.
                  </p>
                )}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <Button
              disabled={!canSubmit || createMutation.isPending}
              onClick={() => {
                if (userInfo.role !== "instructor") return;
                createMutation.mutate();
              }}
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
