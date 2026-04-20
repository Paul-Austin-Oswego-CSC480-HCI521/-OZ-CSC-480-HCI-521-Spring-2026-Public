"use client";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enrollUser,
  getAllUsers,
  ClassUser,
} from "@/components/custom/utils/api_utils/req/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classID: string;
  existingEmails: string[];
}

export default function StudentSearchPicker({
  classID,
  existingEmails,
}: Props) {
  const [query, setQuery] = useState("");
  const qc = useQueryClient();

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: getAllUsers,
  });

  const enrollMutation = useMutation({
    mutationFn: (email: string) => enrollUser(email, classID),
    onSuccess: (_data, email) => {
      qc.invalidateQueries({ queryKey: ["roster", classID] });
      qc.invalidateQueries({ queryKey: ["class", classID] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      qc.invalidateQueries({ queryKey: ["users-from-class", classID] });
      toast.success(
        `Enrolled ${email}. Ask them to log out and log back in to see the class.`,
      );
    },
    onError: () => toast.error("Failed to enroll student"),
  });

  const existing = useMemo(() => new Set(existingEmails), [existingEmails]);
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!allUsers || !q) return [] as ClassUser[];
    return allUsers
      .filter((u) => u.role === "student" && !existing.has(u.email))
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [allUsers, q, existing]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading users...</p>
      )}

      {q && filtered.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground">No matching students.</p>
      )}

      {filtered.length > 0 && (
        <ul className="space-y-1 max-h-64 overflow-auto">
          {filtered.map((u) => (
            <li
              key={u.email}
              className="flex items-center justify-between border rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {u.email}
                </p>
              </div>
              <Button
                size="sm"
                disabled={enrollMutation.isPending}
                onClick={() => enrollMutation.mutate(u.email)}
                className="cursor-pointer"
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
