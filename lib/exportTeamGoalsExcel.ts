import ExcelJS from "exceljs";

export interface ExportGoalRow {
  title: string;
  progressPct: number;
  completionDate: string | null;
}

export interface ExportProjectRow {
  project: string;
  pmCsm: string;
  blocker: string;
}

export interface ExportMemberGroup {
  name: string;
  projects: ExportProjectRow[];
  goals: ExportGoalRow[];
}

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCFE8F7" } };
const GREEN_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6E0B4" } };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};
const CENTER_ALIGN: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };

const COLUMNS = ["Name", "Project", "PM | CSM", "Blockers / Issues", "Technical Goal", "Goal Progress", "Completion Date"];
const COLUMN_WIDTHS = [18, 26, 22, 22, 32, 14, 16];

export function buildTeamGoalsWorkbook(groups: ExportMemberGroup[], teamTitle: string): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Technical Goal Progress");
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${teamTitle} Team - Technical Goal Progress`;
  titleCell.font = { bold: true };
  titleCell.alignment = CENTER_ALIGN;
  titleCell.fill = HEADER_FILL;
  titleCell.border = THIN_BORDER;

  COLUMNS.forEach((label, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = label;
    cell.font = { bold: true };
    cell.alignment = CENTER_ALIGN;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });

  let row = 3;
  for (const group of groups) {
    const projects = group.projects.length > 0 ? group.projects : [{ project: "Unassigned", pmCsm: "N/A", blocker: "N/A" }];
    const goals = group.goals.length > 0 ? group.goals : [{ title: "", progressPct: 0, completionDate: null }];
    const rowCount = Math.max(projects.length, goals.length);
    const groupStartRow = row;

    for (let i = 0; i < rowCount; i += 1) {
      const project = projects[i];
      const goal = goals[i];

      const nameCell = sheet.getCell(row, 1);
      nameCell.border = THIN_BORDER;
      nameCell.alignment = CENTER_ALIGN;

      const projectCell = sheet.getCell(row, 2);
      projectCell.value = project?.project ?? "";
      projectCell.border = THIN_BORDER;
      projectCell.alignment = CENTER_ALIGN;

      const pmCsmCell = sheet.getCell(row, 3);
      pmCsmCell.value = project?.pmCsm ?? "";
      pmCsmCell.border = THIN_BORDER;
      pmCsmCell.alignment = CENTER_ALIGN;

      const blockerCell = sheet.getCell(row, 4);
      blockerCell.value = project?.blocker ?? "";
      blockerCell.border = THIN_BORDER;
      blockerCell.alignment = CENTER_ALIGN;

      const goalCell = sheet.getCell(row, 5);
      const progressCell = sheet.getCell(row, 6);
      const completionCell = sheet.getCell(row, 7);
      goalCell.border = THIN_BORDER;
      progressCell.border = THIN_BORDER;
      completionCell.border = THIN_BORDER;
      goalCell.alignment = CENTER_ALIGN;
      progressCell.alignment = CENTER_ALIGN;
      completionCell.alignment = CENTER_ALIGN;

      if (goal) {
        const isComplete = goal.progressPct === 100;
        goalCell.value = goal.title;
        progressCell.value = `${goal.progressPct}%`;
        completionCell.value = goal.completionDate ?? "";
        if (isComplete) {
          goalCell.fill = GREEN_FILL;
          progressCell.fill = GREEN_FILL;
        }
      }

      row += 1;
    }

    const groupEndRow = row - 1;
    sheet.getCell(groupStartRow, 1).value = group.name;
    if (groupEndRow > groupStartRow) {
      sheet.mergeCells(groupStartRow, 1, groupEndRow, 1);
    }

    row += 1; // blank separator row between members, matching the reference layout
  }

  return workbook;
}

export async function downloadTeamGoalsExcel(groups: ExportMemberGroup[], teamTitle: string) {
  const workbook = buildTeamGoalsWorkbook(groups, teamTitle);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${teamTitle.replace(/\s+/g, "_")}_Technical_Goal_Progress.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
