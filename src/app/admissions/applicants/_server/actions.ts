'use server';

import { getStudentByUserId } from '@registry/students';
import { getActiveProgram } from '@registry/students/_lib/utils';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import type { UserRole } from '@/core/auth/permissions';
import type { applicants, guardians } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { formatPersonName } from '@/shared/lib/utils/names';
import { applicantsService } from './service';

type Applicant = typeof applicants.$inferInsert;
type Guardian = typeof guardians.$inferInsert;

const APPLICANT_ELIGIBLE_ROLES: UserRole[] = ['user', 'applicant'];

export async function canCurrentUserApply(): Promise<{
	canApply: boolean;
	role: UserRole | null;
	hasExistingApplicant: boolean;
}> {
	const session = await auth();
	if (!session?.user?.id) {
		return { canApply: false, role: null, hasExistingApplicant: false };
	}

	const role = session.user.role as UserRole;
	const canApply = APPLICANT_ELIGIBLE_ROLES.includes(role);

	if (canApply) {
		return { canApply: true, role, hasExistingApplicant: false };
	}

	if (role === 'student') {
		const student = await getStudentByUserId(session.user.id);
		const activeProgram = getActiveProgram(student);
		if (!activeProgram) {
			return { canApply: true, role, hasExistingApplicant: false };
		}
	}

	const existingApplicant = await applicantsService.findByUserId(
		session.user.id
	);

	return {
		canApply: false,
		role,
		hasExistingApplicant: !!existingApplicant,
	};
}

export async function getApplicant(id: string) {
	return applicantsService.get(id);
}

export async function findApplicantByUserId(userId: string) {
	return applicantsService.findByUserId(userId);
}

export async function findApplicantByNationalIdWithUser(nationalId: string) {
	return applicantsService.findByNationalIdWithUser(nationalId);
}

export const getOrCreateApplicantForCurrentUser = createAction(async () =>
	applicantsService.getOrCreateForCurrentUser()
);

export async function findAllApplicants(
	page = 1,
	search = '',
	intakePeriodId?: string
) {
	return applicantsService.search(page, search, intakePeriodId);
}

export const createApplicant = createAction(async (data: Applicant) =>
	applicantsService.create({
		...data,
		fullName: formatPersonName(data.fullName) ?? data.fullName,
	})
);

export const updateApplicant = createAction(
	async (id: string, data: Applicant) =>
		applicantsService.update(id, {
			...data,
			fullName: formatPersonName(data.fullName) ?? data.fullName,
		})
);

export const deleteApplicant = createAction(async (id: string) =>
	applicantsService.delete(id)
);

export const addApplicantPhone = createAction(
	async (applicantId: string, phoneNumber: string) =>
		applicantsService.addPhone(applicantId, phoneNumber)
);

export const removeApplicantPhone = createAction(async (phoneId: string) =>
	applicantsService.removePhone(phoneId)
);

export const createGuardian = createAction(
	async (data: Guardian, phoneNumbers?: string[]) =>
		applicantsService.createGuardian(
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			phoneNumbers
		)
);

export const updateGuardian = createAction(
	async (id: string, data: Partial<Guardian>, phoneNumbers?: string[]) =>
		applicantsService.updateGuardian(
			id,
			{
				...data,
				name: formatPersonName(data.name) ?? data.name,
			},
			phoneNumbers
		)
);

export const deleteGuardian = createAction(async (id: string) =>
	applicantsService.deleteGuardian(id)
);

export const addGuardianPhone = createAction(
	async (guardianId: string, phoneNumber: string) =>
		applicantsService.addGuardianPhone(guardianId, phoneNumber)
);

export const removeGuardianPhone = createAction(async (phoneId: string) =>
	applicantsService.removeGuardianPhone(phoneId)
);

export async function getEligibleProgramsForApplicant(applicantId: string) {
	return applicantsService.findEligiblePrograms(applicantId);
}

export const updateApplicantUserId = createAction(
	async (applicantId: string, userId: string | null) =>
		applicantsService.updateUserId(applicantId, userId)
);

type ReverseGeoResult = {
	country: string | null;
	city: string | null;
	district: string | null;
};

async function reverseGeocode(
	lat: number,
	lng: number
): Promise<ReverseGeoResult> {
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
		const res = await fetch(url, {
			headers: { 'User-Agent': 'LimkokwingRegistryWeb/1.0' },
		});
		if (!res.ok) return { country: null, city: null, district: null };
		const data = await res.json();
		const addr = data.address ?? {};
		return {
			country: addr.country ?? null,
			city: addr.city ?? addr.town ?? addr.village ?? null,
			district: addr.state_district ?? addr.county ?? addr.state ?? null,
		};
	} catch {
		return { country: null, city: null, district: null };
	}
}

export const saveApplicantLocation = createAction(
	async (applicantId: string, latitude: number, longitude: number) => {
		const hdrs = await headers();
		const ipAddress =
			hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
			hdrs.get('x-real-ip') ??
			null;

		const geo = await reverseGeocode(latitude, longitude);

		return applicantsService.saveLocation({
			applicantId,
			latitude,
			longitude,
			country: geo.country,
			city: geo.city,
			district: geo.district,
			ipAddress,
		});
	}
);
