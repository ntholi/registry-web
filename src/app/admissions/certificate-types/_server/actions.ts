'use server';

import type { certificateTypes, gradeMappings } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { UserFacingError } from '@/shared/lib/utils/extractError';
import { certificateTypesService } from './service';

type CertificateType = typeof certificateTypes.$inferInsert;
type GradeMapping = {
	originalGrade: string;
	standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
};

export const getCertificateType = createAction(async (id: string) =>
	certificateTypesService.get(id)
);

export const findAllCertificateTypes = createAction(
	async (page: number = 1, search: string = '') =>
		certificateTypesService.search(page, search)
);

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

export const getCertificateTypeByName = createAction(async (name: string) =>
	certificateTypesService.findByName(name)
);

export const isCertificateTypeInUse = createAction(async (id: string) =>
	certificateTypesService.isInUse(id)
);

export const mapGrade = createAction(
	async (certificateTypeId: string, originalGrade: string) =>
		certificateTypesService.mapGrade(certificateTypeId, originalGrade)
);
