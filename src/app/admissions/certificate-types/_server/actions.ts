'use server';

import type { certificateTypes, gradeMappings } from '@/core/database';
import { certificateTypesService } from './service';

type CertificateType = typeof certificateTypes.$inferInsert;
type GradeMapping = {
	originalGrade: string;
	standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
};

export async function getCertificateType(id: number) {
	return certificateTypesService.get(id);
}

export async function findAllCertificateTypes(page = 1, search = '') {
	return certificateTypesService.search(page, search);
}

export async function createCertificateType(
	data: CertificateType & { gradeMappings?: GradeMapping[] }
) {
	const { gradeMappings: mappings, ...certData } = data;
	const result = await certificateTypesService.createWithMappings(
		certData,
		mappings
	);
	if (!result) {
		throw new Error('Failed to create certificate type');
	}
	return result;
}

export async function updateCertificateType(
	id: number,
	data: CertificateType & { gradeMappings?: GradeMapping[] }
) {
	const { gradeMappings: mappings, ...certData } = data;
	const result = await certificateTypesService.updateWithMappings(
		id,
		certData,
		mappings
	);
	if (!result) {
		throw new Error('Failed to update certificate type');
	}
	return result;
}

export async function deleteCertificateType(id: number) {
	return certificateTypesService.delete(id);
}

export async function isCertificateTypeInUse(id: number) {
	return certificateTypesService.isInUse(id);
}
