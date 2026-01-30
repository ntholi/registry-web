'use server';

import type { certificateTypes, gradeMappings } from '@/core/database';
import {
	type ActionResult,
	failure,
	success,
} from '@/shared/lib/utils/actionResult';
import { certificateTypesService } from './service';

type CertificateType = typeof certificateTypes.$inferInsert;
type GradeMapping = {
	originalGrade: string;
	standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
};
type CertificateTypeResult = NonNullable<
	Awaited<ReturnType<typeof certificateTypesService.createWithMappings>>
>;

export async function getCertificateType(id: string) {
	return certificateTypesService.get(id);
}

export async function findAllCertificateTypes(page = 1, search = '') {
	return certificateTypesService.search(page, search);
}

export async function createCertificateType(
	data: CertificateType & { gradeMappings?: GradeMapping[] }
): Promise<ActionResult<CertificateTypeResult>> {
	const { gradeMappings: mappings, ...certData } = data;
	const result = await certificateTypesService.createWithMappings(
		certData,
		mappings
	);
	if (!result) {
		return failure('Failed to create certificate type');
	}
	return success(result);
}

export async function updateCertificateType(
	id: string,
	data: CertificateType & { gradeMappings?: GradeMapping[] }
): Promise<ActionResult<CertificateTypeResult>> {
	const { gradeMappings: mappings, ...certData } = data;
	const result = await certificateTypesService.updateWithMappings(
		id,
		certData,
		mappings
	);
	if (!result) {
		return failure('Failed to update certificate type');
	}
	return success(result);
}

export async function deleteCertificateType(id: string) {
	return certificateTypesService.delete(id);
}

export async function getCertificateTypeByName(name: string) {
	return certificateTypesService.findByName(name);
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
