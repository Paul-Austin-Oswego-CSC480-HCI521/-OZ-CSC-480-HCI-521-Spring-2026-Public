"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enrollUser,
  getAllUsers,
  ClassUser,
} from "@/components/custom/utils/api_utils/req/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classID: string;
  existingEmails: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StudentSearchPicker({
  classID,
  existingEmails,
}: Props) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
  });

  const userByEmail = useMemo(() => {
    const m = new Map<string, ClassUser>();
    (allUsers ?? []).forEach((u) => {
      if (u.email) m.set(u.email.toLowerCase(), u);
    });
    return m;
  }, [allUsers]);

  const existingSet = useMemo(
    () => new Set(existingEmails.map((e) => e.toLowerCase())),
    [existingEmails],
  );

  const chipsSet = useMemo(() => new Set(chips), [chips]);

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q || !allUsers) return [] as ClassUser[];
    return allUsers
      .filter((u) => u.role === "student")
      .filter((u) => {
        const email = u.email?.toLowerCase() ?? "";
        if (!email) return false;
        if (existingSet.has(email)) return false;
        if (chipsSet.has(email)) return false;
        return (
          email.includes(q) || (u.name?.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 8);
  }, [draft, allUsers, existingSet, chipsSet]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [draft]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const tryAddChip = (raw: string): boolean => {
    const email = raw.trim().toLowerCase();
    if (!email) return false;
    if (!EMAIL_RE.test(email)) {
      setError("Invalid email format.");
      return false;
    }
    if (chipsSet.has(email)) {
      setError("Already added.");
      return false;
    }
    if (existingSet.has(email)) {
      setError("Student is already in this class.");
      return false;
    }
    const user = userByEmail.get(email);
    if (!user) {
      setError("No account found for this email.");
      return false;
    }
    if (user.role !== "student") {
      setError("This email belongs to a non-student user.");
      return false;
    }
    setChips((prev) => [...prev, email]);
    setError(null);
    return true;
  };

  const flushDraft = () => {
    const pieces = draft.split(/[\s,;]+/).filter(Boolean);
    if (pieces.length === 0) return;
    let addedAny = false;
    for (const p of pieces) {
      if (tryAddChip(p)) addedAny = true;
    }
    if (addedAny) setDraft("");
  };

  const pickSuggestion = (user: ClassUser) => {
    if (tryAddChip(user.email)) {
      setDraft("");
      setSuggestionsOpen(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestionsOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        pickSuggestion(suggestions[highlightIdx]);
        return;
      }
      if (e.key === "Escape") {
        setSuggestionsOpen(false);
        return;
      }
    }

    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      flushDraft();
    } else if (e.key === "Backspace" && !draft && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const removeChip = (email: string) => {
    setChips((prev) => prev.filter((e) => e !== email));
  };

  const enrollMutation = useMutation({
    mutationFn: (email: string) => enrollUser(email, classID),
  });

  const handleInviteAll = async () => {
    if (chips.length === 0) return;
    setEnrolling(true);
    let successCount = 0;
    const failed: string[] = [];
    for (const email of chips) {
      try {
        await enrollMutation.mutateAsync(email);
        successCount++;
      } catch {
        failed.push(email);
      }
    }
    qc.invalidateQueries({ queryKey: ["roster", classID] });
    qc.invalidateQueries({ queryKey: ["class", classID] });
    qc.invalidateQueries({ queryKey: ["all-users"] });
    qc.invalidateQueries({ queryKey: ["users-from-class", classID] });

    if (successCount > 0) {
      toast.success(
        `Enrolled ${successCount} student${successCount === 1 ? "" : "s"}. Ask them to log out and back in.`,
      );
    }
    if (failed.length > 0) {
      toast.error(`Failed to enroll: ${failed.join(", ")}`);
    }
    setChips(failed);
    setEnrolling(false);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="relative">
        <div
          onClick={() => inputRef.current?.focus()}
          className="min-h-11 w-full rounded-md border px-2 py-1.5 flex flex-wrap items-center gap-1.5 cursor-text bg-white"
        >
          {chips.map((email) => {
            const user = userByEmail.get(email);
            const label = user?.name?.trim() || email;
            return (
              <span
                key={email}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-900 text-xs font-medium pl-2 pr-1 py-0.5"
              >
                <span className="truncate max-w-[220px]">{label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(email);
                  }}
                  className="hover:bg-emerald-200 rounded p-0.5 cursor-pointer"
                  aria-label={`Remove ${email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSuggestionsOpen(true);
              if (error) setError(null);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              chips.length === 0 ? "Search name or email..." : ""
            }
            className="flex-1 min-w-[200px] h-7 border-0 shadow-none px-1 focus-visible:ring-0"
          />
        </div>

        {suggestionsOpen && suggestions.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md border bg-white shadow-lg">
            {suggestions.map((u, i) => {
              const highlighted = i === highlightIdx;
              return (
                <li
                  key={u.email}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickSuggestion(u);
                  }}
                  onMouseEnter={() => setHighlightIdx(i)}
                  className={`px-3 py-2 cursor-pointer ${
                    highlighted ? "bg-emerald-50" : ""
                  }`}
                >
                  <p className="text-sm font-medium truncate">
                    {u.name || u.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button
          size="sm"
          disabled={chips.length === 0 || enrolling}
          onClick={handleInviteAll}
          className="cursor-pointer"
        >
          {enrolling
            ? "Enrolling..."
            : `Invite ${chips.length || ""} ${chips.length === 1 ? "Student" : "Students"}`.trim()}
        </Button>
      </div>
    </div>
  );
}
