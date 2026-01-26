'use server';

import { updateApplicant } from '@admissions/applicants';
import { type ActionResult, extractError } from '@apply/_lib/errors';
import type { applicants } from '@/core/database';

type ApplicantInput = typeof applicants.$inferInsert;

export async function updateApplicantProfile(
	id: string,
	data: ApplicantInput
): Promise<ActionResult<void>> {
	try {
		await updateApplicant(id, data);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
