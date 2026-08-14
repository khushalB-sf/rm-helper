"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STATUSES = ["ON_TRACK", "AT_RISK", "BLOCKED"] as const;

export interface ProjectAssignment {
  id: string;
  hoursPerDay: number;
  status: string;
  blocker: string | null;
  startDate: string;
  endDate: string | null;
  project: { id: string; name: string };
}

interface ProjectsManagerProps {
  initialAssignments: ProjectAssignment[];
}

const statusTone: Record<string, "secondary" | "outline" | "destructive"> = {
  ON_TRACK: "secondary",
  AT_RISK: "outline",
  BLOCKED: "destructive",
};

const ProjectsManager = ({ initialAssignments }: ProjectsManagerProps) => {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const active = assignments.filter((a) => !a.endDate);
  const ended = assignments.filter((a) => a.endDate);

  async function updateAssignment(id: string, patch: Record<string, unknown>) {
    setSaving(true);
    setError(undefined);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setAssignments((prev) => prev.map((a) => (a.id === id ? data.assignment : a)));
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {active.length === 0 && (
        <Alert>
          <AlertDescription>
            You have no active projects — you&apos;re currently unassigned. Head to{" "}
            <Link href="/goals/personal" className="underline underline-offset-4">
              Goals
            </Link>{" "}
            to let your manager know what you&apos;re working on and an ETA.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        {active.map((assignment) =>
          editingId === assignment.id ? (
            <Card key={assignment.id}>
              <CardContent>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    updateAssignment(assignment.id, {
                      hoursPerDay: Number(formData.get("hoursPerDay")),
                      status: formData.get("status"),
                      blocker: formData.get("blocker"),
                    });
                  }}
                  className="flex flex-col gap-2"
                >
                  <p className="font-medium">{assignment.project.name}</p>
                  <Input name="hoursPerDay" type="number" min={0.5} max={24} step={0.5} defaultValue={assignment.hoursPerDay} placeholder="Hours/day" />
                  <Select name="status" defaultValue={assignment.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea name="blocker" defaultValue={assignment.blocker ?? ""} placeholder="Any blocker? (optional)" rows={2} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                      onClick={() => updateAssignment(assignment.id, { ended: true })}
                    >
                      Mark ended
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.project.name}</CardTitle>
                <CardAction>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(assignment.id)}>
                    Edit
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{assignment.hoursPerDay}hr/day</span>
                  <Badge variant={statusTone[assignment.status] ?? "secondary"}>{assignment.status.replace("_", " ")}</Badge>
                </div>
                {assignment.blocker && <p className="text-sm text-destructive">Blocker: {assignment.blocker}</p>}
              </CardContent>
            </Card>
          )
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ended.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Past projects</h2>
          {ended.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between rounded-md border p-2 text-sm text-muted-foreground">
              <span>{assignment.project.name}</span>
              <span>{assignment.hoursPerDay}hr/day · ended {new Date(assignment.endDate as string).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
