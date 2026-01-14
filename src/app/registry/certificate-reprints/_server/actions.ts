'use server';

import type { certificateReprints } from '@registry/_database';
import { revalidatePath } from 'next/cache';
import { certificateReprintsService as service } from './service';

type CertificateReprint = typeof certificateReprints.$inferInsert;
type CertificateReprintUpdate = Partial<
	typeof certificateReprints.$inferInsert
>;

export async function getCertificateReprint(id: number) {
	return service.get(id);
}

export async function getCertificateReprintsByStdNo(stdNo: number) {
	return service.findByStdNo(stdNo);
}

export async function createCertificateReprint(data: CertificateReprint) {
	const result = await service.create(data);
	revalidatePath(`/registry/students/${data.stdNo}`);
	return result;
}

export async function updateCertificateReprint(
	id: number,
	data: CertificateReprintUpdate
) {
	const result = await service.update(id, data);
	if (result?.stdNo) {
		revalidatePath(`/registry/students/${result.stdNo}`);
	}
	return result;
}

export async function deleteCertificateReprint(id: number) {
	return service.delete(id);
}
