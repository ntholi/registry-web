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
		await updateApplicant(id, {
			...data,
			fullName: formatPersonName(data.fullName) ?? data.fullName,
		}).then(unwrap);
	}
);

export const addPhone = createAction(
	async (applicantId: string, phoneNumber: string) => {
		await addApplicantPhone(applicantId, phoneNumber).then(unwrap);
	}
);

export const removePhone = createAction(async (phoneId: string) => {
	await removeApplicantPhone(phoneId).then(unwrap);
});

export const addNewGuardian = createAction(
	async (data: GuardianInput, phoneNumbers?: string[]) => {
		await createGuardian(
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			phoneNumbers
		).then(unwrap);
	}
);

export const updateExistingGuardian = createAction(
	async (id: string, data: Partial<GuardianInput>, phoneNumbers?: string[]) => {
		await updateGuardian(
			id,
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			phoneNumbers
		).then(unwrap);
	}
);

export const removeGuardian = createAction(async (id: string) => {
	await deleteGuardian(id).then(unwrap);
});

export const addGuardianPhoneNumber = createAction(
	async (guardianId: string, phoneNumber: string) => {
		await addGuardianPhone(guardianId, phoneNumber).then(unwrap);
	}
);

export const removeGuardianPhoneNumber = createAction(
	async (phoneId: string) => {
		await removeGuardianPhone(phoneId).then(unwrap);
	}
);
