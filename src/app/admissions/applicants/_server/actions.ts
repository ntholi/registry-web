'use server';

import { findActiveIntakePeriod } from '@admissions/intake-periods';
import type { UserRole } from '@auth/users/_schema/users';
import { auth } from '@/core/auth';
import type { applicants, guardians } from '@/core/database';
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

	const existingApplicant = await applicantsService.findByUserId(
		session.user.id
	);

	return {
		canApply: false,
		role,
		hasExistingApplicant: !!existingApplicant,
	};
}

export type ApplicationProgress = {
	hasApplication: boolean;
	applicationId: string | null;
	nextStepUrl: string;
	isSubmitted: boolean;
};

export async function getCurrentUserApplicationProgress(): Promise<ApplicationProgress> {
	const session = await auth();
	if (!session?.user?.id) {
		return {
			hasApplication: false,
			applicationId: null,
			nextStepUrl: '/apply/welcome',
			isSubmitted: false,
		};
	}

	const applicant = await applicantsService.findByUserId(session.user.id);
	if (!applicant) {
		return {
			hasApplication: false,
			applicationId: null,
			nextStepUrl: '/apply/welcome',
			isSubmitted: false,
		};
	}

	const activeIntake = await findActiveIntakePeriod();
	if (!activeIntake) {
		return {
			hasApplication: false,
			applicationId: null,
			nextStepUrl: '/apply',
			isSubmitted: false,
		};
	}

	const currentApp = applicant.applications.find(
		(app) => app.intakePeriodId === activeIntake.id
	);

	if (!currentApp) {
		return {
			hasApplication: false,
			applicationId: null,
			nextStepUrl: '/apply/welcome',
			isSubmitted: false,
		};
	}

	if (currentApp.status === 'submitted') {
		return {
			hasApplication: true,
			applicationId: currentApp.id,
			nextStepUrl: '/apply/profile',
			isSubmitted: true,
		};
	}

	const hasIdentity = applicant.documents.some(
		(d) => d.document.type === 'identity'
	);
	const hasQualifications = applicant.academicRecords.length > 0;
	const hasFirstChoice = !!currentApp.firstChoiceProgramId;
	const hasPersonalInfo =
		!!applicant.fullName && applicant.guardians.length > 0;

	let nextStep = 'documents';
	if (hasIdentity) nextStep = 'qualifications';
	if (hasIdentity && hasQualifications) nextStep = 'program';
	if (hasIdentity && hasQualifications && hasFirstChoice)
		nextStep = 'personal-info';
	if (hasIdentity && hasQualifications && hasFirstChoice && hasPersonalInfo)
		nextStep = 'review';

	return {
		hasApplication: true,
		applicationId: currentApp.id,
		nextStepUrl: `/apply/${currentApp.id}/${nextStep}`,
		isSubmitted: false,
	};
}

export async function getApplicant(id: string) {
	return applicantsService.get(id);
}

export async function findApplicantByUserId(userId: string) {
	return applicantsService.findByUserId(userId);
}

export async function getOrCreateApplicantForCurrentUser() {
	return applicantsService.getOrCreateForCurrentUser();
}

export async function findAllApplicants(page = 1, search = '') {
	return applicantsService.search(page, search);
}

export async function createApplicant(data: Applicant) {
	return applicantsService.create(data);
}

export async function updateApplicant(id: string, data: Applicant) {
	return applicantsService.update(id, data);
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
	return applicantsService.createGuardian(data, phoneNumbers);
}

export async function updateGuardian(
	id: string,
	data: Partial<Guardian>,
	phoneNumbers?: string[]
) {
	return applicantsService.updateGuardian(id, data, phoneNumbers);
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
