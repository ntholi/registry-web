'use server';

import type { certificateTypes, gradeMappings } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
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

export const createCertificateType = createAction(
	async (data: CertificateType & { gradeMappings?: GradeMapping[] }) => {
		const { gradeMappings: mappings, ...certData } = data;
		const result = await certificateTypesService.createWithMappings(
			certData,
			mappings
		);
		if (!result) {
			throw new UserFacingError('Failed to create certificate type');
		}
		return result;
	}
);

export const updateCertificateType = createAction(
	async (
		id: string,
		data: CertificateType & { gradeMappings?: GradeMapping[] }
	) => {
		const { gradeMappings: mappings, ...certData } = data;
		const result = await certificateTypesService.updateWithMappings(
			id,
			certData,
			mappings
		);
		if (!result) {
			throw new UserFacingError('Failed to update certificate type');
		}
		return result;
	}
);

export const deleteCertificateType = createAction(async (id: string) =>
	certificateTypesService.delete(id)
);

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
