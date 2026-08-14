"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkillRowsEditor, type SkillEntry } from "@/components/skill-rows-editor";

export interface TeamMember {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface TeamRosterProps {
  initialReports: TeamMember[];
  initialSkillsByMember: Record<string, SkillEntry[]>;
}

const TeamRoster = ({ initialReports, initialSkillsByMember }: TeamRosterProps) => {
  const [reports, setReports] = useState(initialReports);
  const [skillsByMember, setSkillsByMember] = useState(initialSkillsByMember);
  const [candidates, setCandidates] = useState<TeamMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [editingSkillsId, setEditingSkillsId] = useState<string | null>(null);
  const [draftSkills, setDraftSkills] = useState<SkillEntry[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | undefined>();

  function startEditingSkills(memberId: string) {
    setSkillsError(undefined);
    const current = skillsByMember[memberId] ?? [];
    setDraftSkills(current.length > 0 ? current : [{ skill: "", expertiseLevel: "NEW" }]);
    setEditingSkillsId(memberId);
  }

  async function saveSkills(memberId: string) {
    setSavingSkills(true);
    setSkillsError(undefined);
    const res = await fetch(`/api/team/${memberId}/skills`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: draftSkills.filter((s) => s.skill.trim()) }),
    });
    const data = await res.json();
    setSavingSkills(false);
    if (!res.ok) {
      setSkillsError(data.message ?? "Something went wrong.");
      return;
    }
    setSkillsByMember((prev) => ({ ...prev, [memberId]: data.skills }));
    setEditingSkillsId(null);
  }

  async function handleSearch(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    if (!query) {
      setCandidates([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/team/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setCandidates(res.ok ? data.candidates : []);
    setSearching(false);
  }

  async function handleAdd(userId: string) {
    setAddingId(userId);
    setMessage(undefined);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setAddingId(null);
    if (!res.ok) {
      setMessage(data.message ?? "Couldn't add that person.");
      return;
    }
    setReports((prev) => [...prev, data.report].sort((a, b) => a.username.localeCompare(b.username)));
    setCandidates((prev) => prev.filter((c) => c.id !== userId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <form onSubmit={handleSearch} className="flex gap-1.5">
          <Input name="query" placeholder="Search by username or email" className="h-7 max-w-56 text-xs" />
          <Button type="submit" size="sm" className="h-7 text-xs" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>

        {message && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {candidates.length > 0 && (
          <ul className="flex max-w-md flex-col gap-1">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between rounded-md border p-1 text-xs">
                <span>
                  {candidate.username} <span className="text-muted-foreground">· {candidate.email}</span>
                </span>
                <Button size="sm" className="h-6 text-xs" onClick={() => handleAdd(candidate.id)} disabled={addingId === candidate.id}>
                  {addingId === candidate.id ? "Adding..." : "Add"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {reports.length === 0 ? (
        <p className="text-xs text-muted-foreground">No team members yet — search above to add one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-1 font-medium">Team member</th>
                <th className="p-1 font-medium">Skills</th>
                <th className="p-1 font-medium" />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) =>
                editingSkillsId === report.id ? (
                  <tr key={report.id} className="border-b align-top last:border-b-0">
                    <td className="p-1 font-medium">
                      {report.username}
                      <div className="font-normal text-muted-foreground">{report.email}</div>
                    </td>
                    <td className="p-1" colSpan={2}>
                      <div className="flex flex-col gap-1.5">
                        <SkillRowsEditor value={draftSkills} onChange={setDraftSkills} />
                        {skillsError && <p className="text-xs text-destructive">{skillsError}</p>}
                        <div className="flex gap-1.5">
                          <Button type="button" size="sm" className="h-6 text-xs" disabled={savingSkills} onClick={() => saveSkills(report.id)}>
                            {savingSkills ? "Saving..." : "Save"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingSkillsId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={report.id} className="border-b align-top last:border-b-0">
                    <td className="p-1 font-medium">
                      {report.username}
                      <div className="font-normal text-muted-foreground">{report.email}</div>
                    </td>
                    <td className="p-1">
                      {(skillsByMember[report.id]?.length ?? 0) > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skillsByMember[report.id].map((entry) => (
                            <Badge key={entry.skill} variant="secondary" className="text-[10px]">
                              {entry.skill} · {entry.expertiseLevel}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No skills added yet.</span>
                      )}
                    </td>
                    <td className="p-1 text-right">
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => startEditingSkills(report.id)}>
                        Edit skills
                      </Button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamRoster;
