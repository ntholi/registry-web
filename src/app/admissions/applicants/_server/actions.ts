'use server';

import type { UserRole } from '@auth/users/_schema/users';
import { getStudentByUserId } from '@registry/students';
import { getActiveProgram } from '@registry/students/_lib/utils';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import type { applicants, guardians } from '@/core/database';
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

export async function getOrCreateApplicantForCurrentUser() {
	return applicantsService.getOrCreateForCurrentUser();
}

export async function findAllApplicants(page = 1, search = '') {
	return applicantsService.search(page, search);
}

export async function createApplicant(data: Applicant) {
	return applicantsService.create({
		...data,
		fullName: formatPersonName(data.fullName) ?? data.fullName,
	});
}

export async function updateApplicant(id: string, data: Applicant) {
	return applicantsService.update(id, {
		...data,
		fullName: formatPersonName(data.fullName) ?? data.fullName,
	});
}

export async function deleteApplicant(id: string) {
	return applicantsService.delete(id);
}

export async function addApplicantPhone(
	applicantId: string,
	phoneNumber: string
) {
	return applicantsService.addPhone(applicantId, phoneNumber);
}

export async function removeApplicantPhone(phoneId: string) {
	return applicantsService.removePhone(phoneId);
}

export async function createGuardian(data: Guardian, phoneNumbers?: string[]) {
	return applicantsService.createGuardian(
		{
			...data,
			name: formatPersonName(data.name) ?? data.name,
		},
		phoneNumbers
	);
}

export async function updateGuardian(
	id: string,
	data: Partial<Guardian>,
	phoneNumbers?: string[]
) {
	return applicantsService.updateGuardian(
		id,
		{
			...data,
			name: formatPersonName(data.name) ?? data.name,
		},
		phoneNumbers
	);
}

export async function deleteGuardian(id: string) {
	return applicantsService.deleteGuardian(id);
}

export async function addGuardianPhone(
	guardianId: string,
	phoneNumber: string
) {
	return applicantsService.addGuardianPhone(guardianId, phoneNumber);
}

export async function removeGuardianPhone(phoneId: string) {
	return applicantsService.removeGuardianPhone(phoneId);
}

export async function getEligibleProgramsForApplicant(applicantId: string) {
	return applicantsService.findEligiblePrograms(applicantId);
}

export async function updateApplicantUserId(
	applicantId: string,
	userId: string | null
) {
	return applicantsService.updateUserId(applicantId, userId);
}

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

export async function saveApplicantLocation(
	applicantId: string,
	latitude: number,
	longitude: number
) {
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
