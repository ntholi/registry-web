'use server';

import {
	addApplicantPhone,
	addGuardianPhone,
	createGuardian,
	deleteGuardian,
	removeApplicantPhone,
	removeGuardianPhone,
	updateApplicant,
	updateGuardian,
} from '@admissions/applicants';
import type { applicants, guardians } from '@/core/database';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { formatPersonName } from '@/shared/lib/utils/names';

type ApplicantInput = typeof applicants.$inferInsert;
type GuardianInput = typeof guardians.$inferInsert;

export const updateApplicantInfo = createAction(
	async (id: string, data: ApplicantInput) => {
		await unwrap(
			await updateApplicant(id, {
				...data,
				fullName: formatPersonName(data.fullName) ?? data.fullName,
			})
		);
	}
);

export const addPhone = createAction(
	async (applicantId: string, phoneNumber: string) => {
		await unwrap(await addApplicantPhone(applicantId, phoneNumber));
	}
);

export const removePhone = createAction(async (phoneId: string) => {
	await unwrap(await removeApplicantPhone(phoneId));
});

export const addNewGuardian = createAction(
	async (data: GuardianInput, phoneNumbers?: string[]) => {
		await unwrap(
			await createGuardian(
				{
					...data,
					name: formatPersonName(data.name) ?? data.name,
				},
				phoneNumbers
			)
		);
	}
);

export const updateExistingGuardian = createAction(
	async (id: string, data: Partial<GuardianInput>, phoneNumbers?: string[]) => {
		await unwrap(
			await updateGuardian(
				id,
				{
					...data,
					name: formatPersonName(data.name) ?? data.name,
				},
				phoneNumbers
			)
		);
	}
);

export const removeGuardian = createAction(async (id: string) => {
	await unwrap(await deleteGuardian(id));
});

export const addGuardianPhoneNumber = createAction(
	async (guardianId: string, phoneNumber: string) => {
		await unwrap(await addGuardianPhone(guardianId, phoneNumber));
	}
);

export const removeGuardianPhoneNumber = createAction(
	async (phoneId: string) => {
		await unwrap(await removeGuardianPhone(phoneId));
	}
);
