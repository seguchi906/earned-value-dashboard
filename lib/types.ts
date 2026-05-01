// Shared types for the earned-value dashboard.

export type Field =
  | "驕楢ｷｯ"
  | "豐ｳ蟾昴・遐る亟"
  | "讖区｢∬ｨｭ險・"
  | "轤ｹ讀・"
  | "遨咲ｮ苓｣懷勧"
  | "諤･蛯ｾ譁懷慍"
  | "轣ｽ螳ｳ"
  | "荳区ｰｴ驕・";

export const ALL_FIELDS: Field[] = [
  "驕楢ｷｯ",
  "豐ｳ蟾昴・遐る亟",
  "讖区｢∬ｨｭ險・",
  "轤ｹ讀・",
  "遨咲ｮ苓｣懷勧",
  "諤･蛯ｾ譁懷慍",
  "轣ｽ螳ｳ",
  "荳区ｰｴ驕・",
];

export type ProjectStatus =
  | "螳檎ｴ・"
  | "莉ｮ邏榊刀"
  | "騾ｲ陦御ｸｭ"
  | "譛ｪ逹謇・";

export type ResponsibleSection = string;

export interface RawProject {
  id: string;
  field: Field;
  number: string;
  name: string;
  office: string;
  department: string;
  section?: string;
  manager: string;
  assignees: string[];
  startDate: string;
  endDate: string;
  originalStartDate?: string;
  originalEndDate?: string;
  revisedStartDate?: string;
  revisedEndDate?: string;
  completionTargetDate?: string;
  contractAmount: number | null;
  status: ProjectStatus;
  evaluation?: number | null;
  note?: string;
  responsibleSections?: ResponsibleSection[];
  responsibleDept?: string;
  staffMain?: string;
  staffManagement?: string;
  staffReview?: string;
  staffSub?: string;
  allocationAmount?: number | null;
  allocationSection1?: number | null;
  allocationSection2?: number | null;
  allocationSection3?: number | null;
  outsourcingAmount?: number | null;
}

export interface ProjectsFile {
  title?: string;
  updatedAt?: string;
  fiscalPeriods?: { label: string; start: string; end: string }[];
  projects: RawProject[];
}

// Progress dashboard export. During migration we accept both:
// - old format: id contains the business number
// - new format: number contains the business number
export interface RawProgressProject {
  id?: string;
  number?: string;
  name: string;
  section?: string;
  startDate?: string | null;
  endDate?: string | null;
  weeklyProgress?: (number | null)[];
  wp?: (number | null)[];
  comments?: unknown[];
}

export interface MergedProject {
  number: string;
  name: string;
  field: Field;
  status: ProjectStatus;
  contractAmount: number | null;
  allocationSection1: number | null;
  allocationSection2: number | null;
  allocationSection3: number | null;
  outsourcingAmount: number | null;
  responsibleSections: ResponsibleSection[];
  weeklyProgress: (number | null)[];
  startDate: string;
  endDate: string;
}

export interface EarnedValue {
  project: MergedProject;
  progressRate: number;
  total: number;
  section1: number;
  section2: number;
  section3: number;
}

export interface SectionSummary {
  section: ResponsibleSection;
  earnedValue: number;
  contractAmount: number;
}

export interface FieldSummary {
  field: Field;
  earnedValue: number;
  contractAmount: number;
  outsourcingAmount: number;
  projectCount: number;
}

export interface WeeklyTrend {
  weekLabel: string;
  weekDate: Date;
  totalEarned: number;
  section1Earned: number;
  section2Earned: number;
  section3Earned: number;
  totalContract: number;
}

export interface AllocationTrend {
  weekLabel: string;
  weekDate: Date;
  section1: number;
  section2: number;
  section3: number;
  total: number;
}

export interface RawOutsourcingRecord {
  jobNo: string;
  workName: string;
  company: string;
  latestAmount: number;
  latestStartDate: string | null;
}

export interface OutsourcingTrend {
  weekLabel: string;
  weekDate: Date;
  total: number;
}

export interface StoredData {
  projects: RawProject[];
  progressProjects: RawProgressProject[];
  outsourcingRecords: RawOutsourcingRecord[];
  projectsLoadedAt: string | null;
  progressLoadedAt: string | null;
  outsourcingLoadedAt: string | null;
  projectsFileTitle: string | null;
}
