"use client";

import Link from "next/link";
import { useState } from "react";
import type { CvProject } from "@/lib/skills";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SkillRowsEditor, emptySkill, type SkillEntry } from "@/components/skill-rows-editor";

export type { SkillEntry };

interface ProfileFormProps {
  currentSkills: SkillEntry[];
  currentYearsOfExperience: number | null;
  currentPhone: string | null;
  currentOrganizations: string[];
  currentProjects: CvProject[];
  email: string;
  role: "RM" | "TEAM_MEMBER";
}

interface Profile {
  skills: SkillEntry[];
  yearsOfExperience: number | null;
  phone: string | null;
  organizations: string[];
  projects: CvProject[];
}

type Section = "contact" | "experience" | "skills" | "organizations" | "projects";

const emptyProject: CvProject = { name: "", description: "", period: null };

const ProfileForm = ({
  currentSkills,
  currentYearsOfExperience,
  currentPhone,
  currentOrganizations,
  currentProjects,
  email,
  role,
}: ProfileFormProps) => {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [profile, setProfile] = useState<Profile>({
    skills: currentSkills,
    yearsOfExperience: currentYearsOfExperience,
    phone: currentPhone,
    organizations: currentOrganizations,
    projects: currentProjects,
  });
  const [editing, setEditing] = useState<Section | null>(null);
  const [draftProjects, setDraftProjects] = useState<CvProject[]>([]);
  const [draftSkills, setDraftSkills] = useState<SkillEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [sectionError, setSectionError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [messageIsError, setMessageIsError] = useState(false);
  const [pending, setPending] = useState(false);

  function startEditing(section: Section) {
    setSectionError(undefined);
    if (section === "projects") {
      setDraftProjects(profile.projects.length > 0 ? profile.projects : [emptyProject]);
    }
    if (section === "skills") {
      setDraftSkills(profile.skills.length > 0 ? profile.skills : [emptySkill]);
    }
    setEditing(section);
  }

  async function saveSection(data: Record<string, unknown>) {
    setSaving(true);
    setSectionError(undefined);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Something went wrong.");
      setProfile((prev) => ({ ...prev, ...json }));
      setEditing(null);
    } catch (error) {
      setSectionError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);

    const formData = new FormData(event.currentTarget);
    let res: Response;

    if (mode === "upload") {
      const file = formData.get("cv");
      if (!(file instanceof File) || file.size === 0) {
        setMessage("Choose a PDF file first.");
        setMessageIsError(true);
        setPending(false);
        return;
      }
      const uploadData = new FormData();
      uploadData.set("cv", file);
      res = await fetch("/api/profile", { method: "POST", body: uploadData });
    } else {
      const text = String(formData.get("text") ?? "");
      res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    }

    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setMessage(data.message ?? "Something went wrong.");
      setMessageIsError(true);
      return;
    }

    setProfile({
      skills: data.skills,
      yearsOfExperience: data.yearsOfExperience,
      phone: data.phone,
      organizations: data.organizations,
      projects: data.projects,
    });
    setMessage("Profile updated.");
    setMessageIsError(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          {editing !== "contact" && (
            <CardAction>
              <Button type="button" variant="ghost" size="sm" onClick={() => startEditing("contact")}>
                Edit
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {editing === "contact" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const phone = String(new FormData(event.currentTarget).get("phone") ?? "").trim();
                saveSection({ phone: phone || null });
              }}
              className="flex flex-col gap-2"
            >
              <p className="text-sm text-muted-foreground">{email}</p>
              <Input name="phone" defaultValue={profile.phone ?? ""} placeholder="Phone number" />
              {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{email}</p>
              <p className="text-sm text-muted-foreground">{profile.phone ?? "No phone number added yet."}</p>
              {role === "RM" && <p className="text-sm text-muted-foreground">Position: RM</p>}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Years of experience</CardTitle>
          {editing !== "experience" && (
            <CardAction>
              <Button type="button" variant="ghost" size="sm" onClick={() => startEditing("experience")}>
                Edit
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {editing === "experience" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const raw = String(new FormData(event.currentTarget).get("years") ?? "").trim();
                saveSection({ yearsOfExperience: raw ? Number(raw) : null });
              }}
              className="flex flex-col gap-2"
            >
              <Input name="years" type="number" min={0} defaultValue={profile.yearsOfExperience ?? ""} placeholder="Years of experience" />
              {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">{profile.yearsOfExperience ?? "Not added yet."}</p>
          )}
        </CardContent>
      </Card>

      {role !== "RM" && (
      <>
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          {editing !== "skills" && (
            <CardAction>
              <Button type="button" variant="ghost" size="sm" onClick={() => startEditing("skills")}>
                Edit
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {editing === "skills" ? (
            <div className="flex flex-col gap-3">
              <SkillRowsEditor value={draftSkills} onChange={setDraftSkills} />
              {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => saveSection({ skills: draftSkills.filter((s) => s.skill.trim()) })}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((entry) => (
                <Badge key={entry.skill} variant="secondary">
                  {entry.skill} · {entry.expertiseLevel}
                </Badge>
              ))}
              <Link
                href="/tests/new"
                className="mt-3 block w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Start a test →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past organizations</CardTitle>
          {editing !== "organizations" && (
            <CardAction>
              <Button type="button" variant="ghost" size="sm" onClick={() => startEditing("organizations")}>
                Edit
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {editing === "organizations" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const raw = String(new FormData(event.currentTarget).get("organizations") ?? "");
                saveSection({
                  organizations: raw
                    .split(",")
                    .map((org) => org.trim())
                    .filter(Boolean),
                });
              }}
              className="flex flex-col gap-2"
            >
              <Input name="organizations" defaultValue={profile.organizations.join(", ")} placeholder="Acme Inc, Globex Corp" />
              {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : profile.organizations.length > 0 ? (
            <p className="text-sm text-muted-foreground">{profile.organizations.join(", ")}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No organizations added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent projects</CardTitle>
          {editing !== "projects" && (
            <CardAction>
              <Button type="button" variant="ghost" size="sm" onClick={() => startEditing("projects")}>
                Edit
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {editing === "projects" ? (
            <div className="flex flex-col gap-3">
              {draftProjects.map((project, index) => (
                <div key={index} className="flex flex-col gap-2 border border-border rounded p-2">
                  <Input
                    placeholder="Project name"
                    value={project.name}
                    onChange={(event) =>
                      setDraftProjects((prev) => prev.map((p, i) => (i === index ? { ...p, name: event.target.value } : p)))
                    }
                  />
                  <Textarea
                    placeholder="Description"
                    rows={2}
                    value={project.description}
                    onChange={(event) =>
                      setDraftProjects((prev) => prev.map((p, i) => (i === index ? { ...p, description: event.target.value } : p)))
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Period (e.g. 2022-2023)"
                      value={project.period ?? ""}
                      onChange={(event) =>
                        setDraftProjects((prev) =>
                          prev.map((p, i) => (i === index ? { ...p, period: event.target.value || null } : p))
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraftProjects((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setDraftProjects((prev) => [...prev, emptyProject])}>
                Add project
              </Button>
              {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() =>
                    saveSection({ projects: draftProjects.filter((p) => p.name.trim() && p.description.trim()) })
                  }
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : profile.projects.length > 0 ? (
            <div className="flex flex-col gap-2">
              {profile.projects.map((project) => (
                <div key={project.name} className="text-sm border border-border rounded p-2">
                  <p className="font-medium">
                    {project.name}
                    {project.period && <span className="font-normal text-muted-foreground"> · {project.period}</span>}
                  </p>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import from CV</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button type="button" variant={mode === "paste" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("paste")}>
              Paste text
            </Button>
            <Button type="button" variant={mode === "upload" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("upload")}>
              Upload PDF
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "paste" ? (
              <Textarea name="text" required rows={10} placeholder="Paste your CV text here..." />
            ) : (
              <Input name="cv" type="file" accept="application/pdf" required />
            )}

            {message && (
              <Alert variant={messageIsError ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button disabled={pending} type="submit">
              {pending ? "Extracting..." : "Extract from CV"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
};

export default ProfileForm;
