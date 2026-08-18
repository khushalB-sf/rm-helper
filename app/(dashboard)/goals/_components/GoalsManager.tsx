"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Meter } from "@/components/meter";

export interface Goal {
  id: string;
  type: "DEPARTMENTAL" | "BENCH";
  title: string;
  description: string | null;
  progressPct: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  lastCompletionDate: string | null;
  completionDate: string | null;
  createdAt: string;
  assignedBy: { username: string } | null;
  tests: { id: string; score: number | null; questionCount: number; completedAt: string | null }[];
}

interface GoalsManagerProps {
  initialGoals: Goal[];
  isUnassigned: boolean;
}

function meterTone(goal: Goal): "good" | "warning" | "critical" | "neutral" {
  if (goal.status === "COMPLETED") return "good";
  if (goal.lastCompletionDate && new Date(goal.lastCompletionDate) < new Date()) return "critical";
  return "neutral";
}

const GoalsManager = ({ initialGoals, isUnassigned }: GoalsManagerProps) => {
  const [goals, setGoals] = useState(initialGoals);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [progressDraft, setProgressDraft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const hasOpenBenchGoal = goals.some((g) => g.type === "BENCH" && g.status !== "COMPLETED");

  async function postUpdate(goalId: string, progressPct: number, note: string, completionDate?: string) {
    setSaving(true);
    setError(undefined);
    const res = await fetch(`/api/goals/${goalId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressPct, note, completionDate }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    const status = progressPct >= 100 ? "COMPLETED" : progressPct > 0 ? "IN_PROGRESS" : "NOT_STARTED";
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, progressPct, status, completionDate: status === "COMPLETED" ? completionDate ?? g.completionDate : g.completionDate } : g
      )
    );
    setUpdatingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {isUnassigned && !hasOpenBenchGoal && (
        <Alert>
          <AlertDescription>
            You&apos;re unassigned — let your manager know what you&apos;re working on so they can set a bench goal for you.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => {
            const latestTest = goal.tests[0];
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {goal.title}
                    <Badge variant="outline">{goal.type}</Badge>
                    {goal.assignedBy && <span className="text-xs font-normal text-muted-foreground">from {goal.assignedBy.username}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                  <Meter value={goal.progressPct} label={goal.status.replace("_", " ")} tone={meterTone(goal)} />
                  <p className="text-xs text-muted-foreground">Created on: {new Date(goal.createdAt).toLocaleDateString()}</p>
                  {goal.lastCompletionDate && (
                    <p className="text-xs text-muted-foreground">
                      Last date of completion: {new Date(goal.lastCompletionDate).toLocaleDateString()}
                    </p>
                  )}
                  {goal.completionDate && (
                    <p className="text-xs text-muted-foreground">
                      Date of completion: {new Date(goal.completionDate).toLocaleDateString()}
                    </p>
                  )}
                  {latestTest && (
                    <Badge variant={latestTest.completedAt ? "secondary" : "outline"}>
                      {latestTest.completedAt ? `Test: ${latestTest.score}/${latestTest.questionCount}` : "Test in progress"}
                    </Badge>
                  )}

                  {goal.status !== "COMPLETED" &&
                    (updatingId === goal.id ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          postUpdate(
                            goal.id,
                            progressDraft,
                            String(formData.get("note") ?? ""),
                            progressDraft >= 100 ? String(formData.get("completionDate") ?? "") : undefined
                          );
                        }}
                        className="flex flex-col gap-2 border-t pt-3"
                      >
                        <Input
                          name="progressPct"
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={progressDraft}
                          onChange={(e) => setProgressDraft(Number(e.target.value))}
                          placeholder="Progress %"
                        />
                        <Textarea name="note" placeholder="Note for this week (optional)" rows={2} />
                        {progressDraft >= 100 && (
                          <Input
                            name="completionDate"
                            type="date"
                            required
                            defaultValue={new Date().toISOString().slice(0, 10)}
                            aria-label="Date of completion"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={saving}>
                            {saving ? "Saving..." : "Save update"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setUpdatingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex gap-2 border-t pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUpdatingId(goal.id);
                            setProgressDraft(goal.progressPct);
                          }}
                        >
                          Post weekly update
                        </Button>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link href={`/tests/new?goalId=${goal.id}`}>Start completion test</Link>
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalsManager;
