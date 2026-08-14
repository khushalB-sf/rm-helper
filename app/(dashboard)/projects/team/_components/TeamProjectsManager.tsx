"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { dayFraction } from "@/components/team-pill";

interface Report {
  id: string;
  username: string;
}

export interface TeamAssignment {
  id: string;
  hoursPerDay: number;
  status: string;
  blocker: string | null;
  endDate: string | null;
  project: { name: string; pmCsm: string | null };
  user: { id: string; username: string };
}

interface TeamProjectsManagerProps {
  reports: Report[];
  initialAssignments: TeamAssignment[];
}

const statusTone: Record<string, "secondary" | "outline" | "destructive"> = {
  ON_TRACK: "secondary",
  AT_RISK: "outline",
  BLOCKED: "destructive",
};

const TeamProjectsManager = ({ reports, initialAssignments }: TeamProjectsManagerProps) => {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function assignProject(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/team/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: formData.get("userId"),
        projectName: formData.get("projectName"),
        hoursPerDay: Number(formData.get("hoursPerDay")),
        pmCsm: formData.get("pmCsm"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setAssignments((prev) => [data.assignment, ...prev]);
    setOpen(false);
  }

  const activeAssignments = assignments.filter((a) => !a.endDate);
  const reportsWithoutActiveProject = reports.filter((r) => !activeAssignments.some((a) => a.user.id === r.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assignments</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={reports.length === 0}>
              New assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign a project</DialogTitle>
            </DialogHeader>
            <form onSubmit={assignProject} className="flex flex-col gap-2">
              <Select name="userId" required defaultValue={reports[0]?.id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Team member" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input name="projectName" required placeholder="Project name" />
              <Input name="hoursPerDay" type="number" min={0.5} max={24} step={0.5} required placeholder="Hours/day (e.g. 4)" />
              <Input name="pmCsm" placeholder="PM / CSM (optional)" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={saving} className="self-start">
                {saving ? "Assigning..." : "Assign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {reportsWithoutActiveProject.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reportsWithoutActiveProject.map((r) => (
            <Badge key={r.id} variant="outline">
              {r.username} — unassigned
            </Badge>
          ))}
        </div>
      )}

      {activeAssignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects assigned yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2 font-medium">Team member</th>
                <th className="p-2 font-medium">Project</th>
                <th className="p-2 font-medium">PM / CSM</th>
                <th className="p-2 font-medium">Hours/day</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Blocker</th>
              </tr>
            </thead>
            <tbody>
              {activeAssignments.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="p-2 font-medium">{a.user.username}</td>
                  <td className="p-2">{a.project.name}</td>
                  <td className="p-2 text-xs text-muted-foreground">{a.project.pmCsm ?? ""}</td>
                  <td className="p-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {dayFraction(a.hoursPerDay)}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={statusTone[a.status] ?? "secondary"}>{a.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="p-2 text-xs text-destructive">{a.blocker ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamProjectsManager;
