import type { attendance } from '@/core/database';

export type Attendance = typeof attendance.$inferSelect;
export type AttendanceInsert = typeof attendance.$inferInsert;

export type AttendanceStatusType =
	| 'present'
	| 'absent'
	| 'late'
	| 'excused'
	| 'na';

export type WeekInfo = {
	weekNumber: number;
	startDate: Date;
	endDate: Date;
	isCurrent: boolean;
};

export type StudentAttendance = {
	stdNo: number;
	name: string;
	attendanceId: number | null;
	status: AttendanceStatusType;
};

export type AttendanceSummary = {
	stdNo: number;
	name: string;
	weeklyAttendance: { weekNumber: number; status: AttendanceStatusType }[];
	presentCount: number;
	absentCount: number;
	lateCount: number;
	excusedCount: number;
	attendanceRate: number;
	totalWeeks: number;
	markedWeeks: number;
};

export type AssignedModuleInfo = {
	assignedModuleId: number;
	semesterModuleId: number;
	moduleCode: string;
	moduleName: string;
	programId: number;
	semesterName: string;
	termId: number;
};
