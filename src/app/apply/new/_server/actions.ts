'use server';

import { applicants as applicantsTable } from '@admissions/applicants/_schema/applicants';
import { findApplicantByUserId } from '@admissions/applicants/_server/actions';
import {
	analyzeDocumentWithAI,
	createAcademicRecordFromDocument,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { users } from '@auth/users/_schema/users';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { redirect, unauthorized } from 'next/navigation';
import { auth } from '@/core/auth';
import type { DocumentType } from '@/core/database';
import { db } from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai';
import { uploadDocument } from '@/core/integrations/storage';

export async function getCurrentApplicant() {
	const session = await auth();
	if (!session?.user?.id) return null;
	return findApplicantByUserId(session.user.id);
}

export async function getOrCreateApplicant() {
	const session = await auth();
	if (!session?.user?.id) {
		return unauthorized();
	}

	const userId = session.user.id;
	const userName = session.user.name;

	const existing = await findApplicantByUserId(userId);
	if (existing) return existing;

	const [applicant] = await db.transaction(async (tx) => {
		const [newApplicant] = await tx
			.insert(applicantsTable)
			.values({
				userId,
				fullName: userName || 'New Applicant',
				dateOfBirth: '2000-01-01',
				nationality: 'Lesotho',
				gender: 'Male',
			})
			.returning();

		await tx
			.update(users)
			.set({ role: 'applicant' })
			.where(eq(users.id, userId));

		return [newApplicant];
	});

	return applicant;
}

function getFileExtension(name: string) {
	const idx = name.lastIndexOf('.');
	if (idx === -1 || idx === name.length - 1) return '';
	return name.slice(idx);
}

function mapDocumentTypeFromAI(
	result: DocumentAnalysisResult
): DocumentType | null {
	if (result.category === 'identity') {
		return result.documentType === 'identity'
			? 'identity'
			: result.documentType === 'passport_photo'
				? 'passport_photo'
				: null;
	}
	if (result.category === 'academic') {
		switch (result.documentType) {
			case 'certificate':
				return 'certificate';
			case 'transcript':
				return 'transcript';
			case 'academic_record':
				return 'academic_record';
			case 'recommendation_letter':
				return 'recommendation_letter';
			default:
				return 'certificate';
		}
	}
	if (result.category === 'other') {
		switch (result.documentType) {
			case 'proof_of_payment':
				return 'proof_of_payment';
			case 'personal_statement':
				return 'personal_statement';
			case 'medical_report':
				return 'medical_report';
			case 'enrollment_letter':
				return 'enrollment_letter';
			case 'clearance_form':
				return 'clearance_form';
			default:
				return 'other';
		}
	}
	return null;
}

export async function uploadAndAnalyzeDocument(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) {
		return unauthorized();
	}

	const file = formData.get('file') as File;
	if (!file) throw new Error('No file provided');

	const applicant = await getOrCreateApplicant();
	if (!applicant) throw new Error('Failed to get applicant');

	const folder = 'documents/admissions';
	const fileName = `${nanoid()}${getFileExtension(file.name)}`;

	await uploadDocument(file, fileName, folder);

	const buffer = await file.arrayBuffer();
	const base64 = Buffer.from(buffer).toString('base64');
	const result = await analyzeDocumentWithAI(base64, file.type);

	const type = mapDocumentTypeFromAI(result) || 'other';

	await saveApplicantDocument({
		applicantId: applicant.id,
		fileName,
		type,
	});

	if (result.category === 'identity' && type === 'identity') {
		await updateApplicantFromIdentity(applicant.id, {
			fullName: result.fullName,
			dateOfBirth: result.dateOfBirth,
			nationalId: result.nationalId,
			nationality: result.nationality,
			gender: result.gender,
			birthPlace: result.birthPlace,
			address: result.address,
		});
	}

	if (
		result.category === 'academic' &&
		(type === 'certificate' ||
			type === 'transcript' ||
			type === 'academic_record') &&
		result.examYear &&
		result.institutionName
	) {
		await createAcademicRecordFromDocument(applicant.id, {
			institutionName: result.institutionName,
			qualificationName: result.qualificationName,
			examYear: result.examYear,
			certificateType: result.certificateType,
			certificateNumber: result.certificateNumber,
			subjects: result.subjects,
			overallClassification: result.overallClassification,
		});
	}

	return { result, type, fileName };
}

export async function completeApplication() {
	const session = await auth();
	if (!session?.user?.id) {
		return unauthorized();
	}

	const applicant = await findApplicantByUserId(session.user.id);
	if (!applicant) throw new Error('No applicant found');

	redirect('/apply/courses');
}
