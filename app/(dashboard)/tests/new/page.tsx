import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import NewTestForm from "./_components/NewTestForm";

const NewTestPage = async ({ searchParams }: PageProps<"/tests/new">) => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const res = await serverFetch("/api/profile");
  const skillEntries: { skill: string }[] = res.ok ? (await res.json()).skills : [];
  const skills = skillEntries.map((entry) => entry.skill);
  if (skills.length === 0) redirect("/profile");

  const params = await searchParams;
  const goalId = typeof params.goalId === "string" ? params.goalId : undefined;

  return (
    <PageContainer>
      <PageHeader title="New test" />
      <NewTestForm skills={skills} goalId={goalId} />
    </PageContainer>
  );
};

export default NewTestPage;
