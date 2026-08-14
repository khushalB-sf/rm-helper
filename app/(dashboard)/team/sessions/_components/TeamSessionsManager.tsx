"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Report {
  id: string;
  username: string;
}

export interface TeamInternalSession {
  id: string;
  title: string;
  description: string | null;
  presenterId: string | null;
  presenter: { username: string } | null;
  conductedDate: string | null;
  recordingUrl: string | null;
  presentationUrl: string | null;
  githubUrl: string | null;
  referenceUrl: string | null;
}

export interface TeamAttendanceEntry {
  id: string;
  title: string;
  attendedDate: string;
  notes: string | null;
  user: { id: string; username: string };
}

interface TeamSessionsManagerProps {
  reports: Report[];
  initialSessions: TeamInternalSession[];
  attendance: TeamAttendanceEntry[];
}

const TeamSessionsManager = ({ reports, initialSessions, attendance }: TeamSessionsManagerProps) => {
  const [sessions, setSessions] = useState(initialSessions);
  const [adding, setAdding] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function createSession(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const presenterId = formData.get("presenterId");
    const res = await fetch("/api/team/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        presenterId: presenterId || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setSessions((prev) => [data.session, ...prev]);
    setAdding(false);
  }

  async function assignPresenter(event: React.SubmitEvent<HTMLFormElement>, sessionId: string) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch(`/api/team/sessions/${sessionId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presenterId: formData.get("presenterId") }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? data.session : s)));
    setAssigningId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Internal team sessions</h2>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions created yet.</p>
        ) : (
          sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {s.title}
                  {s.presenterId ? (
                    <Badge variant="secondary">Assigned to {s.presenter?.username}</Badge>
                  ) : (
                    <Badge variant="outline">Unassigned</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                {s.conductedDate && <p className="text-xs text-muted-foreground">Conducted {new Date(s.conductedDate).toLocaleDateString()}</p>}
                {s.recordingUrl && (
                  <a href={s.recordingUrl} className="text-xs underline underline-offset-4">
                    Recording
                  </a>
                )}
                {s.presentationUrl && (
                  <a href={s.presentationUrl} className="text-xs underline underline-offset-4">
                    Presentation
                  </a>
                )}
                {s.githubUrl && (
                  <a href={s.githubUrl} className="text-xs underline underline-offset-4">
                    GitHub repo
                  </a>
                )}
                {s.referenceUrl && (
                  <a href={s.referenceUrl} className="text-xs underline underline-offset-4">
                    Reference
                  </a>
                )}

                {assigningId === s.id ? (
                  <form onSubmit={(e) => assignPresenter(e, s.id)} className="flex gap-2 border-t pt-3">
                    <Select name="presenterId" required defaultValue={s.presenterId ?? undefined}>
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
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAssigningId(null)}>
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="w-fit border-t pt-2" onClick={() => setAssigningId(s.id)}>
                    {s.presenterId ? "Reassign" : "Assign"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {adding ? (
          <Card>
            <CardHeader>
              <CardTitle>New internal session</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createSession} className="flex flex-col gap-2">
                <Input name="title" required placeholder="Session title" />
                <Textarea name="description" placeholder="Description (optional)" rows={2} />
                <Select name="presenterId">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to (optional, can do later)" />
                  </SelectTrigger>
                  <SelectContent>
                    {reports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Creating..." : "Create"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button type="button" variant="outline" className="w-fit" onClick={() => setAdding(true)}>
            New session
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Organisational sessions attended</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance logged yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {attendance.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  {entry.user.username} <span className="text-muted-foreground">· {entry.title}</span>
                </span>
                <span className="text-xs text-muted-foreground">{new Date(entry.attendedDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TeamSessionsManager;
