'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { courseSummaryService } from './service';

export const generateCourseSummaryReport = createAction(
	async (programId: number | undefined, semesterModuleId: number) => {
		const buffer = await courseSummaryService.generateCourseSummaryReport(
			programId,
			semesterModuleId
		);
		return Buffer.from(buffer).toString('base64');
	}
);
