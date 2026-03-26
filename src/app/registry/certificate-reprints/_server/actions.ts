'use server';

import type { certificateReprints } from '@registry/_database';
import { revalidatePath } from 'next/cache';
import { createAction } from '@/shared/lib/actions/actionResult';
import { certificateReprintsService as service } from './service';

type CertificateReprint = typeof certificateReprints.$inferInsert;
type CertificateReprintUpdate = Partial<
	typeof certificateReprints.$inferInsert
>;

export async function getCertificateReprint(id: string) {
	return service.get(id);
}

export async function getCertificateReprintsByStdNo(stdNo: number) {
	return service.findByStdNo(stdNo);
}

export async function findAllCertificateReprints(
	page = 1,
	search = '',
	status?: string
) {
	return service.queryAll(page, search, status);
}

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
