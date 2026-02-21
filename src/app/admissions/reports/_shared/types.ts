import type { ProgramLevel } from '@academic/_database';
import type { ApplicationStatus } from '@admissions/applications/_schema/applications';

export interface AdmissionReportFilter {
	intakePeriodId?: string;
	schoolIds?: number[];
	programId?: number;
	programLevels?: ProgramLevel[];
	applicationStatuses?: ApplicationStatus[];
}
