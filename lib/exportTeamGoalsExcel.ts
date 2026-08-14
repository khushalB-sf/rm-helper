import ExcelJS from "exceljs";

export interface ExportGoalRow {
  title: string;
  progressPct: number;
  completionDate: string | null;
  lastUpdated: string;
}

export interface ExportMemberGroup {
  name: string;
  project: string;
  pmCsm: string;
  blockers: string;
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

const COLUMNS = ["Name", "Project", "PM | CSM", "Blockers / Issues", "Technical Goal", "Goal Progress", "Completion Date", "Last Updated"];
const COLUMN_WIDTHS = [18, 26, 22, 22, 32, 14, 16, 20];

export function buildTeamGoalsWorkbook(groups: ExportMemberGroup[], teamTitle: string): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Technical Goal Progress");
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${teamTitle} Team - Technical Goal Progress`;
  titleCell.font = { bold: true };
  titleCell.alignment = { horizontal: "center" };
  titleCell.fill = HEADER_FILL;
  titleCell.border = THIN_BORDER;

  COLUMNS.forEach((label, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = label;
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });

  let row = 3;
  for (const group of groups) {
    const goals = group.goals.length > 0 ? group.goals : [{ title: "", progressPct: 0, completionDate: null, lastUpdated: "" }];
    const groupStartRow = row;

    goals.forEach((goal) => {
      const isComplete = goal.progressPct === 100;
      sheet.getCell(row, 1).border = THIN_BORDER;
      sheet.getCell(row, 2).border = THIN_BORDER;
      sheet.getCell(row, 3).border = THIN_BORDER;
      sheet.getCell(row, 4).border = THIN_BORDER;

      const goalCell = sheet.getCell(row, 5);
      goalCell.value = goal.title;
      goalCell.border = THIN_BORDER;
      if (isComplete) goalCell.fill = GREEN_FILL;

      const progressCell = sheet.getCell(row, 6);
      progressCell.value = `${goal.progressPct}%`;
      progressCell.border = THIN_BORDER;
      if (isComplete) progressCell.fill = GREEN_FILL;

      const completionCell = sheet.getCell(row, 7);
      completionCell.value = goal.completionDate ?? "";
      completionCell.border = THIN_BORDER;

      const lastUpdatedCell = sheet.getCell(row, 8);
      lastUpdatedCell.value = goal.lastUpdated;
      lastUpdatedCell.border = THIN_BORDER;

      row += 1;
    });

    const groupEndRow = row - 1;
    sheet.getCell(groupStartRow, 1).value = group.name;
    sheet.getCell(groupStartRow, 2).value = group.project;
    sheet.getCell(groupStartRow, 3).value = group.pmCsm;
    sheet.getCell(groupStartRow, 4).value = group.blockers;
    if (groupEndRow > groupStartRow) {
      sheet.mergeCells(groupStartRow, 1, groupEndRow, 1);
      sheet.mergeCells(groupStartRow, 2, groupEndRow, 2);
      sheet.mergeCells(groupStartRow, 3, groupEndRow, 3);
      sheet.mergeCells(groupStartRow, 4, groupEndRow, 4);
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
