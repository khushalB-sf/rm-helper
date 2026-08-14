import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentUserRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import type { CvProject } from "@/lib/skills";
import type { SkillEntry } from "./_components/ProfileForm";
import { PageContainer, PageHeader } from "@/components/page-header";
import ProfileForm from "./_components/ProfileForm";

const ProfilePage = async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const current = await getCurrentUserRole();
  const res = await serverFetch("/api/profile");
  const user: {
    skills: SkillEntry[];
    yearsOfExperience: number | null;
    phone: string | null;
    organizations: string[];
    projects: CvProject[];
    email: string;
  } | null = res.ok ? await res.json() : null;

  return (
    <PageContainer>
      <PageHeader
        title="Your profile"
        description="Edit each section directly, or import from a CV to fill them in one go."
      />
      <ProfileForm
        currentSkills={user?.skills ?? []}
        currentYearsOfExperience={user?.yearsOfExperience ?? null}
        currentPhone={user?.phone ?? null}
        currentOrganizations={user?.organizations ?? []}
        currentProjects={user?.projects ?? []}
        email={user?.email ?? ""}
        role={current?.role ?? "TEAM_MEMBER"}
      />
    </PageContainer>
  );
};

export default ProfilePage;
