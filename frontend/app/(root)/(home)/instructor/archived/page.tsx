"use client";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { userAtom } from "@/components/custom/utils/context/state";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getClasses,
  StudentClass,
} from "@/components/custom/utils/api_utils/req/class";
import { getWorklogsForClass } from "@/components/custom/utils/api_utils/worklogs/allReq";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronRight, FileText } from "lucide-react";

const BRAND_GREEN = "#1E4B35";
const BRAND_GREEN_TINT = "#E8F0EC";

function fmtDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    const cleaned = s.replace(/\[[^\]]+\]$/, "");
    const d = new Date(cleaned);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function parseDate(s: string | undefined): number {
  if (!s) return 0;
  const cleaned = s.replace(/\[[^\]]+\]$/, "");
  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function accentForAge(idx: number, total: number): string {
  if (total <= 1) return BRAND_GREEN;
  const ratio = idx / Math.max(1, total - 1);
  if (ratio < 0.34) return BRAND_GREEN;
  if (ratio < 0.67) return "#f59e0b";
  return "#dc2626";
}

function ArchivedRow({ c, accent }: { c: StudentClass; accent: string }) {
  const { data: worklogs } = useQuery({
    queryKey: ["worklogs-for-class", c.classID],
    queryFn: () => getWorklogsForClass(c.classID),
  });
  const submissions = ((worklogs ?? []) as any[]).filter((w) => !w.isDraft);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-stretch">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: accent }} />
        <CardContent className="flex-1 p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 space-y-1">
            <h2
              className="text-lg sm:text-xl font-bold truncate"
              style={{ color: BRAND_GREEN }}
            >
              {c.classID}
            </h2>
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {fmtDate(c.semesterStartDate)} - {fmtDate(c.semsesterEndDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {submissions.length} submission
                {submissions.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <Link href={`/instructor/archived/${encodeURIComponent(c.classID)}`}>
            <Button
              variant="outline"
              className="gap-1 cursor-pointer border-2"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
            >
              View class
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </div>
    </Card>
  );
}

export default function ArchivedClassPage() {
  const userInfo = useAtomValue(userAtom);
  const [mounted, setMounted] = useState(false);
  const [sort, setSort] = useState<"latest" | "oldest">("latest");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: classes, isLoading, error } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    enabled: userInfo?.role === "instructor",
  });

  const sorted = useMemo(() => {
    const archived: StudentClass[] = (classes ?? []).filter(
      (c) => c.isArchived,
    );
    return archived.sort((a, b) => {
      const ad = parseDate(a.semesterStartDate);
      const bd = parseDate(b.semesterStartDate);
      return sort === "latest" ? bd - ad : ad - bd;
    });
  }, [classes, sort]);

  if (!mounted || !userInfo) return <p className="p-4 sm:p-10">Loading...</p>;
  if (userInfo.role !== "instructor") {
    return (
      <h1 className="p-4 sm:p-10">
        Sorry you do not have access to this page
      </h1>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full">
      <Link href="/instructor">
        <button className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          ← Back
        </button>
      </Link>

      <div
        className="rounded-2xl px-5 sm:px-6 py-5 sm:py-6 mb-6 flex items-center gap-3"
        style={{ backgroundColor: BRAND_GREEN_TINT }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 bg-white shadow-sm"
          style={{ borderColor: BRAND_GREEN }}
        >
          <FileText className="h-6 w-6" style={{ color: BRAND_GREEN }} />
        </span>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: BRAND_GREEN }}
          >
            Archived Classes
          </h1>
          <p className="text-sm text-muted-foreground">
            View work logs from previous classes
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ color: BRAND_GREEN }}
        >
          Previous Classes
        </h2>
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as "latest" | "oldest")}
        >
          <SelectTrigger
            className="w-[140px] border-2 bg-white cursor-pointer"
            style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading classes...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          Failed to load classes: {(error as Error).message}
        </p>
      )}

      {!isLoading && !error && sorted.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No archived classes yet.</p>
          </CardContent>
        </Card>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((c, i) => (
            <ArchivedRow
              key={c.classID}
              c={c}
              accent={accentForAge(i, sorted.length)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
