"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pill, pctTone } from "@/components/team-pill";
import { downloadTeamGoalsExcel } from "@/lib/exportTeamGoalsExcel";
import type { TeamAssignment } from "@/app/(dashboard)/projects/team/_components/TeamProjectsManager";

interface Report {
  id: string;
  username: string;
}

export interface TeamGoal {
  id: string;
  type: "DEPARTMENTAL" | "BENCH";
  title: string;
  description: string | null;
  progressPct: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  lastCompletionDate: string | null;
  completionDate: string | null;
  createdAt: string;
  owner: { id: string; username: string };
  tests: { score: number | null; questionCount: number; completedAt: string | null }[];
  updates: { createdAt: string }[];
}

export interface GoalCatalogEntry {
  id: string;
  title: string;
  type: "DEPARTMENTAL" | "BENCH";
}

interface TeamGoalsManagerProps {
  reports: Report[];
  initialGoals: TeamGoal[];
  assignments: TeamAssignment[];
  initialCatalog: GoalCatalogEntry[];
  teamName: string;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-US") : "";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function activeAssignmentsFor(assignments: TeamAssignment[], userId: string): TeamAssignment[] {
  return assignments.filter((a) => a.user.id === userId && !a.endDate);
}

function projectSummary(active: TeamAssignment[]): string {
  if (active.length === 0) return "Unassigned";
  if (active.length === 1) return active[0].project.name;
  return active.map((a) => `${a.project.name} (${Math.round((a.hoursPerDay / 8) * 100)}%)`).join(" / ");
}

function pmCsmSummary(active: TeamAssignment[]): string {
  const values = [...new Set(active.map((a) => a.project.pmCsm).filter((v): v is string => Boolean(v)))];
  return values.length ? values.join(", ") : "N/A";
}

function blockersSummary(active: TeamAssignment[]): string {
  const values = [...new Set(active.map((a) => a.blocker).filter((v): v is string => Boolean(v)))];
  return values.length ? values.join("; ") : "N/A";
}

function projectRowsFor(active: TeamAssignment[]) {
  return active.map((a) => ({
    project: active.length > 1 ? `${a.project.name} (${Math.round((a.hoursPerDay / 8) * 100)}%)` : a.project.name,
    pmCsm: a.project.pmCsm ?? "N/A",
    blocker: a.blocker ?? "N/A",
  }));
}

const TeamGoalsManager = ({ reports, initialGoals, assignments, initialCatalog, teamName }: TeamGoalsManagerProps) => {
  const [goals, setGoals] = useState(initialGoals);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const [catalog, setCatalog] = useState(initialCatalog);
  const [typeValue, setTypeValue] = useState<GoalCatalogEntry["type"]>("DEPARTMENTAL");
  const [titleValue, setTitleValue] = useState(() => initialCatalog.find((c) => c.type === "DEPARTMENTAL")?.title ?? "");
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogError, setCatalogError] = useState<string | undefined>();

  const titleOptions = catalog.filter((entry) => entry.type === typeValue);

  function changeType(next: GoalCatalogEntry["type"]) {
    setTypeValue(next);
    setTitleValue(catalog.find((entry) => entry.type === next)?.title ?? "");
    setAddingGoal(false);
    setNewGoalTitle("");
    setCatalogError(undefined);
  }

  function closeAssignDialog(next: boolean) {
    setOpen(next);
    if (!next) {
      setAddingGoal(false);
      setNewGoalTitle("");
      setCatalogError(undefined);
      setError(undefined);
    }
  }

  async function commitNewGoal() {
    const title = newGoalTitle.trim();
    if (!title) return;
    setCatalogSaving(true);
    setCatalogError(undefined);
    const res = await fetch("/api/team/goals/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type: typeValue }),
    });
    const data = await res.json();
    setCatalogSaving(false);
    if (!res.ok) {
      setCatalogError(data.message ?? "Something went wrong.");
      return;
    }
    setCatalog((prev) =>
      prev.some((entry) => entry.id === data.catalogEntry.id)
        ? prev
        : [...prev, data.catalogEntry].sort((a, b) => a.title.localeCompare(b.title))
    );
    setTitleValue(data.catalogEntry.title);
    setNewGoalTitle("");
    setAddingGoal(false);
  }

  async function assignGoal(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/team/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: formData.get("userId"),
        type: typeValue,
        title: titleValue,
        description: formData.get("description"),
        lastCompletionDate: typeValue === "BENCH" ? formData.get("lastCompletionDate") : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setGoals((prev) => [...(data.goals ?? [data.goal]), ...prev]);
    setNotice(data.skipped ? `Skipped ${data.skipped} team member(s) who already have this goal.` : undefined);
    setOpen(false);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, { owner: TeamGoal["owner"]; goals: TeamGoal[] }>();
    for (const goal of goals) {
      const entry = map.get(goal.owner.id) ?? { owner: goal.owner, goals: [] };
      entry.goals.push(goal);
      map.set(goal.owner.id, entry);
    }
    return [...map.values()].sort((a, b) => a.owner.username.localeCompare(b.owner.username));
  }, [goals]);

  function handleExport() {
    const exportGroups = grouped.map(({ owner, goals: memberGoals }) => {
      const active = activeAssignmentsFor(assignments, owner.id);
      return {
        name: owner.username,
        projects: projectRowsFor(active),
        goals: memberGoals.map((goal) => ({
          title: goal.title,
          progressPct: goal.progressPct,
          completionDate: formatDate(goal.completionDate) || null,
        })),
      };
    });
    downloadTeamGoalsExcel(exportGroups, teamName);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Goals</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={grouped.length === 0}>
            Export to Excel
          </Button>
          <Dialog open={open} onOpenChange={closeAssignDialog}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={reports.length === 0}>
                New goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign a goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={assignGoal} className="flex flex-col gap-2">
                <Select value={typeValue} onValueChange={(value) => changeType(value as GoalCatalogEntry["type"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEPARTMENTAL">Departmental</SelectItem>
                    <SelectItem value="BENCH">Bench</SelectItem>
                  </SelectContent>
                </Select>

                {addingGoal ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder="New goal title"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitNewGoal();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={commitNewGoal}
                      disabled={catalogSaving || !newGoalTitle.trim()}
                    >
                      {catalogSaving ? "Adding..." : "Add"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingGoal(false);
                        setNewGoalTitle("");
                        setCatalogError(undefined);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    required
                    value={titleValue}
                    onValueChange={(value) => (value === "__ADD_NEW__" ? setAddingGoal(true) : setTitleValue(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Goal title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ADD_NEW__">+ Add new goal</SelectItem>
                      {titleOptions.map((entry) => (
                        <SelectItem key={entry.id} value={entry.title}>
                          {entry.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {catalogError && <p className="text-sm text-destructive">{catalogError}</p>}

                <Select name="userId" required defaultValue={reports[0]?.id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Assign to all</SelectItem>
                    {reports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea name="description" placeholder="Details (optional)" rows={2} />
                {typeValue === "BENCH" && (
                  <Input name="lastCompletionDate" type="date" aria-label="Last date of completion" required />
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" size="sm" disabled={saving || addingGoal || !titleValue} className="self-start">
                  {saving ? "Assigning..." : "Assign goal"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals assigned yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-sky-50 text-left">
                <th className="border p-2 font-medium">Name</th>
                <th className="border p-2 font-medium">Project</th>
                <th className="border p-2 font-medium">PM | CSM</th>
                <th className="border p-2 font-medium">Blockers / Issues</th>
                <th className="border p-2 font-medium">Technical Goal</th>
                <th className="border p-2 font-medium">Goal Progress</th>
                <th className="border p-2 font-medium">Created On</th>
                <th className="border p-2 font-medium">Last Date of Completion</th>
                <th className="border p-2 font-medium">Date of Completion</th>
                <th className="border p-2 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ owner, goals: memberGoals }) => {
                const active = activeAssignmentsFor(assignments, owner.id);
                const project = projectSummary(active);
                const pmCsm = pmCsmSummary(active);
                const blockers = blockersSummary(active);
                return memberGoals.map((goal, index) => {
                  const latestTest = goal.tests[0];
                  const isComplete = goal.progressPct === 100;
                  return (
                    <tr key={goal.id} className="border-b">
                      {index === 0 && (
                        <>
                          <td className="border p-2 align-top font-medium" rowSpan={memberGoals.length}>
                            {owner.username}
                          </td>
                          <td className="border p-2 align-top" rowSpan={memberGoals.length}>
                            {project}
                          </td>
                          <td className="border p-2 align-top text-xs text-muted-foreground" rowSpan={memberGoals.length}>
                            {pmCsm}
                          </td>
                          <td className="border p-2 align-top text-xs text-muted-foreground" rowSpan={memberGoals.length}>
                            {blockers}
                          </td>
                        </>
                      )}
                      <td className={`border p-2 ${isComplete ? "bg-green-100" : ""}`}>
                        {goal.title}
                        {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            {goal.type}
                          </Badge>
                          {latestTest && (
                            <Badge variant={latestTest.completedAt ? "secondary" : "outline"} className="text-[10px]">
                              {latestTest.completedAt ? `${latestTest.score}/${latestTest.questionCount}` : "Test in progress"}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className={`border p-2 ${isComplete ? "bg-green-100" : ""}`}>
                        <Pill color={pctTone(goal.progressPct)}>{goal.progressPct}%</Pill>
                      </td>
                      <td className="border p-2 text-xs text-muted-foreground">{formatDate(goal.createdAt)}</td>
                      <td className="border p-2 text-xs text-muted-foreground">{formatDate(goal.lastCompletionDate)}</td>
                      <td className="border p-2 text-xs text-muted-foreground">{formatDate(goal.completionDate)}</td>
                      <td className="border p-2 text-xs text-muted-foreground">
                        {formatDateTime(goal.updates[0]?.createdAt ?? goal.createdAt)}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamGoalsManager;
