"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/stat-tile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pill } from "@/components/team-pill";

interface Report {
  id: string;
  username: string;
}

export interface TeamCertification {
  id: string;
  name: string;
  status: "APPLIED" | "PASSED" | "FAILED";
  score: number | null;
  maxScore: number | null;
  appliedDate: string | null;
  user: { id: string; username: string };
}

interface TeamCertificationsManagerProps {
  reports: Report[];
  initialCertifications: TeamCertification[];
}

const CERT_TONE: Record<TeamCertification["status"], string> = {
  PASSED: "#0ca30c",
  FAILED: "#d03b3b",
  APPLIED: "#6b7280",
};

const CERT_STATUS_LABEL: Record<TeamCertification["status"], string> = {
  APPLIED: "Applied",
  PASSED: "Passed",
  FAILED: "Failed",
};

const TeamCertificationsManager = ({ reports, initialCertifications }: TeamCertificationsManagerProps) => {
  const [certifications, setCertifications] = useState(initialCertifications);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const passed = certifications.filter((c) => c.status === "PASSED").length;
  const failed = certifications.filter((c) => c.status === "FAILED").length;
  const pending = certifications.filter((c) => c.status === "APPLIED").length;

  async function assignCertification(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/team/certifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: formData.get("userId"), name: formData.get("name") }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Something went wrong.");
      return;
    }
    setCertifications((prev) => [data.certification, ...prev]);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total assigned" value={String(certifications.length)} />
        <StatTile label="Passed" value={String(passed)} />
        <StatTile label="Failed" value={String(failed)} />
        <StatTile label="Pending" value={String(pending)} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Certifications</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={reports.length === 0}>
              New certification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign a certification</DialogTitle>
            </DialogHeader>
            <form onSubmit={assignCertification} className="flex flex-col gap-2">
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
              <Input name="name" required placeholder="e.g. CCAF" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={saving} className="self-start">
                {saving ? "Assigning..." : "Assign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {certifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certifications assigned yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2 font-medium">Team member</th>
                <th className="p-2 font-medium">Certification</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id} className="border-b last:border-b-0">
                  <td className="p-2 font-medium">{cert.user.username}</td>
                  <td className="p-2">{cert.name}</td>
                  <td className="p-2">
                    <Pill color={CERT_TONE[cert.status]}>{CERT_STATUS_LABEL[cert.status]}</Pill>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {cert.score !== null ? `${cert.score}${cert.maxScore !== null ? `/${cert.maxScore}` : ""}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamCertificationsManager;
