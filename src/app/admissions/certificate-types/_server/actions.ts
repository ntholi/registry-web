'use server';

import type { certificateTypes, gradeMappings } from '@/core/database';
import { certificateTypesService } from './service';

type CertificateType = typeof certificateTypes.$inferInsert;
type GradeMapping = {
	originalGrade: string;
	standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
};

export async function getCertificateType(id: string) {
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
	id: string,
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

export async function deleteCertificateType(id: string) {
	return certificateTypesService.delete(id);
}

export async function isCertificateTypeInUse(id: string) {
	return certificateTypesService.isInUse(id);
}

export async function mapGrade(
	certificateTypeId: string,
	originalGrade: string
) {
	return certificateTypesService.mapGrade(certificateTypeId, originalGrade);
}
