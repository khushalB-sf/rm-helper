import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentUserRole } from "@/lib/rbac";
import { serverFetch } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PersonalTeamNav } from "@/app/_components/PersonalTeamNav";
import SessionsManager, { type InternalSessionItem, type AttendanceItem } from "../_components/SessionsManager";

const SessionsPersonalPage = async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [internalRes, attendanceRes, current] = await Promise.all([
    serverFetch("/api/sessions/internal"),
    serverFetch("/api/sessions/attendance"),
    getCurrentUserRole(),
  ]);
  const internalSessions: InternalSessionItem[] = internalRes.ok ? (await internalRes.json()).sessions : [];
  const attendance: AttendanceItem[] = attendanceRes.ok ? (await attendanceRes.json()).attendance : [];

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Sessions" description="Internal team sessions your manager has assigned to you, and organisational sessions you've attended." />
      <PersonalTeamNav basePath="/sessions" showTeam={current?.role === "RM"} />
      <SessionsManager initialInternalSessions={internalSessions} initialAttendance={attendance} />
    </PageContainer>
  );
};

export default SessionsPersonalPage;
