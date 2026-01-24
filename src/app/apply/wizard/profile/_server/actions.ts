'use server';

import { updateApplicant } from '@admissions/applicants';
import type { applicants } from '@/core/database';

type ApplicantInput = typeof applicants.$inferInsert;

export async function updateApplicantProfile(id: string, data: ApplicantInput) {
	return updateApplicant(id, data);
}
