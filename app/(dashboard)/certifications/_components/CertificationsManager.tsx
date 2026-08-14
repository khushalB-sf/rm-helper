"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface Certification {
  id: string;
  name: string;
  status: "APPLIED" | "PASSED" | "FAILED";
  score: number | null;
  maxScore: number | null;
  appliedDate: string | null;
  resultDate: string | null;
  assignedBy: { username: string } | null;
}

const statusTone: Record<Certification["status"], "outline" | "secondary" | "destructive"> = {
  APPLIED: "outline",
  PASSED: "secondary",
  FAILED: "destructive",
};

const CertificationsManager = ({ initialCertifications }: { initialCertifications: Certification[] }) => {
  const [certifications, setCertifications] = useState(initialCertifications);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function recordResult(event: React.SubmitEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch(`/api/certifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: formData.get("status"),
        score: formData.get("score") || null,
        maxScore: formData.get("maxScore") || null,
        appliedDate: formData.get("appliedDate"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setCertifications((prev) => prev.map((c) => (c.id === id ? data.certification : c)));
    setRecordingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {certifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your manager hasn&apos;t assigned any certifications yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {certifications.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {cert.name}
                  <Badge variant={statusTone[cert.status]}>{cert.status}</Badge>
                  {cert.assignedBy && <span className="text-xs font-normal text-muted-foreground">from {cert.assignedBy.username}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {cert.appliedDate && (
                  <p className="text-xs text-muted-foreground">Attempted {new Date(cert.appliedDate).toLocaleDateString()}</p>
                )}
                {cert.score !== null && (
                  <p className="text-sm">
                    Score: {cert.score}
                    {cert.maxScore !== null && `/${cert.maxScore}`}
                  </p>
                )}
                {cert.status === "APPLIED" &&
                  (recordingId === cert.id ? (
                    <form onSubmit={(e) => recordResult(e, cert.id)} className="flex flex-col gap-2 border-t pt-3">
                      <Input name="appliedDate" type="date" required aria-label="Attempted on" />
                      <Select name="status" required defaultValue="PASSED">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PASSED">Passed</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input name="score" type="number" min={0} placeholder="Score (e.g. 620)" />
                        <Input name="maxScore" type="number" min={0} placeholder="Out of (e.g. 1000)" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={saving}>
                          {saving ? "Saving..." : "Save result"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setRecordingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRecordingId(cert.id)}>
                      Record attempt & result
                    </Button>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificationsManager;
