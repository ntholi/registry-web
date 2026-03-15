'use server';

import type { certificateReprints } from '@registry/_database';
import { revalidatePath } from 'next/cache';
import { createAction } from '@/shared/lib/utils/actionResult';
import { certificateReprintsService as service } from './service';

type CertificateReprint = typeof certificateReprints.$inferInsert;
type CertificateReprintUpdate = Partial<
	typeof certificateReprints.$inferInsert
>;

export const getCertificateReprint = createAction(async (id: string) => {
	return service.get(id);
});

export const getCertificateReprintsByStdNo = createAction(
	async (stdNo: number) => {
		return service.findByStdNo(stdNo);
	}
);

export const findAllCertificateReprints = createAction(
	async (page = 1, search = '') => {
		return service.queryAll(page, search);
	}
);

export const createCertificateReprint = createAction(
	async (data: CertificateReprint) => {
		const result = await service.create(data);
		revalidatePath('/registry/certificate-reprints');
		revalidatePath(`/registry/students/${data.stdNo}`);
		return result;
	}
);

export const updateCertificateReprint = createAction(
	async (id: string, data: CertificateReprintUpdate) => {
		const result = await service.update(id, data);
		if (result?.stdNo) {
			revalidatePath(`/registry/students/${result.stdNo}`);
		}
		return result;
	}
);

export const deleteCertificateReprint = createAction(async (id: string) => {
	return service.delete(id);
});
