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
import { type ActionResult, extractError } from '@apply/_lib/errors';
import type { applicants, guardians } from '@/core/database';
import { formatPersonName } from '@/shared/lib/utils/utils';

type ApplicantInput = typeof applicants.$inferInsert;
type GuardianInput = typeof guardians.$inferInsert;

export async function updateApplicantInfo(
	id: string,
	data: ApplicantInput
): Promise<ActionResult<void>> {
	try {
		await updateApplicant(id, {
			...data,
			fullName: formatPersonName(data.fullName) ?? data.fullName,
		});
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function addPhone(
	applicantId: string,
	phoneNumber: string
): Promise<ActionResult<void>> {
	try {
		await addApplicantPhone(applicantId, phoneNumber);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function removePhone(
	phoneId: string
): Promise<ActionResult<void>> {
	try {
		await removeApplicantPhone(phoneId);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function addNewGuardian(
	data: GuardianInput,
	phoneNumbers?: string[]
): Promise<ActionResult<void>> {
	try {
		await createGuardian(
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			phoneNumbers
		);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function updateExistingGuardian(
	id: string,
	data: Partial<GuardianInput>,
	phoneNumbers?: string[]
): Promise<ActionResult<void>> {
	try {
		await updateGuardian(
			id,
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			phoneNumbers
		);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function removeGuardian(id: string): Promise<ActionResult<void>> {
	try {
		await deleteGuardian(id);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function addGuardianPhoneNumber(
	guardianId: string,
	phoneNumber: string
): Promise<ActionResult<void>> {
	try {
		await addGuardianPhone(guardianId, phoneNumber);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function removeGuardianPhoneNumber(
	phoneId: string
): Promise<ActionResult<void>> {
	try {
		await removeGuardianPhone(phoneId);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
