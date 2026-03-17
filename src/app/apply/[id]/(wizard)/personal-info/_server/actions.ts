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
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { formatPersonName } from '@/shared/lib/utils/names';

type ApplicantInput = typeof applicants.$inferInsert;
type GuardianInput = typeof guardians.$inferInsert;

export const updateApplicantInfo = createAction(
	async (id: string, data: ApplicantInput) => {
		unwrap(
			await updateApplicant(id, {
				...data,
				fullName: formatPersonName(data.fullName) ?? data.fullName,
			})
		);
	}
);

export const addPhone = createAction(
	async (applicantId: string, phoneNumber: string) => {
		unwrap(await addApplicantPhone(applicantId, phoneNumber));
	}
);

export const removePhone = createAction(async (phoneId: string) => {
	unwrap(await removeApplicantPhone(phoneId));
});

export const addNewGuardian = createAction(
	async (data: GuardianInput, phoneNumbers?: string[]) => {
		unwrap(
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
		unwrap(
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
	unwrap(await deleteGuardian(id));
});

export const addGuardianPhoneNumber = createAction(
	async (guardianId: string, phoneNumber: string) => {
		unwrap(await addGuardianPhone(guardianId, phoneNumber));
	}
);

export const removeGuardianPhoneNumber = createAction(
	async (phoneId: string) => {
		unwrap(await removeGuardianPhone(phoneId));
	}
);
