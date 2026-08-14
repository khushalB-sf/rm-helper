"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface InternalSessionItem {
  id: string;
  title: string;
  description: string | null;
  conductedDate: string | null;
  recordingUrl: string | null;
  presentationUrl: string | null;
  githubUrl: string | null;
  referenceUrl: string | null;
}

export interface AttendanceItem {
  id: string;
  title: string;
  attendedDate: string;
  notes: string | null;
}

interface SessionsManagerProps {
  initialInternalSessions: InternalSessionItem[];
  initialAttendance: AttendanceItem[];
}

const SessionsManager = ({ initialInternalSessions, initialAttendance }: SessionsManagerProps) => {
  const [internalSessions, setInternalSessions] = useState(initialInternalSessions);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [addingAttendance, setAddingAttendance] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function updateDelivery(event: React.SubmitEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch(`/api/sessions/internal/${id}/deliver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conductedDate: formData.get("conductedDate"),
        recordingUrl: formData.get("recordingUrl"),
        presentationUrl: formData.get("presentationUrl"),
        githubUrl: formData.get("githubUrl"),
        referenceUrl: formData.get("referenceUrl"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setInternalSessions((prev) => prev.map((s) => (s.id === id ? data.session : s)));
    setEditingSessionId(null);
  }

  async function addAttendance(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/sessions/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        attendedDate: formData.get("attendedDate"),
        notes: formData.get("notes"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setAttendance((prev) => [data.entry, ...prev]);
    setAddingAttendance(false);
  }

  async function editAttendance(event: React.SubmitEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch(`/api/sessions/attendance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        attendedDate: formData.get("attendedDate"),
        notes: formData.get("notes"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setAttendance((prev) => prev.map((a) => (a.id === id ? data.entry : a)));
    setEditingAttendanceId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Internal team sessions</h2>
        {internalSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your manager hasn&apos;t assigned you any sessions yet.</p>
        ) : (
          internalSessions.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}

                {editingSessionId === s.id ? (
                  <form onSubmit={(e) => updateDelivery(e, s.id)} className="flex flex-col gap-2 border-t pt-3">
                    <Input name="conductedDate" type="date" defaultValue={s.conductedDate?.slice(0, 10)} aria-label="Date conducted" />
                    <Input name="recordingUrl" defaultValue={s.recordingUrl ?? ""} placeholder="Recording URL" />
                    <Input name="presentationUrl" defaultValue={s.presentationUrl ?? ""} placeholder="Presentation URL" />
                    <Input name="githubUrl" defaultValue={s.githubUrl ?? ""} placeholder="GitHub repo URL" />
                    <Input name="referenceUrl" defaultValue={s.referenceUrl ?? ""} placeholder="Reference URL" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingSessionId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-1 border-t pt-3">
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
                    <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setEditingSessionId(s.id)}>
                      {s.conductedDate ? "Update details" : "Log delivery"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Organisational sessions attended</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance logged yet.</p>
        ) : (
          attendance.map((entry) =>
            editingAttendanceId === entry.id ? (
              <Card key={entry.id}>
                <CardContent>
                  <form onSubmit={(e) => editAttendance(e, entry.id)} className="flex flex-col gap-2">
                    <Input name="title" required defaultValue={entry.title} placeholder="Session title" />
                    <Input name="attendedDate" type="date" required defaultValue={entry.attendedDate.slice(0, 10)} />
                    <Textarea name="notes" defaultValue={entry.notes ?? ""} placeholder="Notes (optional)" rows={2} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingAttendanceId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.attendedDate).toLocaleDateString()}</p>
                    {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingAttendanceId(entry.id)}>
                    Edit
                  </Button>
                </CardContent>
              </Card>
            )
          )
        )}

        {addingAttendance ? (
          <Card>
            <CardHeader>
              <CardTitle>Log attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addAttendance} className="flex flex-col gap-2">
                <Input name="title" required placeholder="Session title" />
                <Input name="attendedDate" type="date" required aria-label="Date attended" />
                <Textarea name="notes" placeholder="Notes (optional)" rows={2} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Adding..." : "Add"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAddingAttendance(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button type="button" variant="outline" className="w-fit" onClick={() => setAddingAttendance(true)}>
            Log attendance
          </Button>
        )}
      </section>
    </div>
  );
};

export default SessionsManager;
