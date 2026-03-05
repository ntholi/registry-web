'use server';

import type { certificateReprints } from '@registry/_database';
import { revalidatePath } from 'next/cache';
import { getPublishedAcademicHistory } from '@/app/registry/students/_server/actions';
import { failure } from '@/shared/lib/utils/actionResult';
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

export async function findAllCertificateReprints(page = 1, search = '') {
	return service.queryAll(page, search);
}

export async function createCertificateReprint(data: CertificateReprint) {
	const student = await getPublishedAcademicHistory(data.stdNo);
	const graduated = student?.programs?.find(
		(p) => p?.status === 'Completed' && p?.graduationDate
	);
	if (!graduated) {
		return failure(
			'Student does not have a graduation date. Certificate reprints are only available for graduated students.'
		);
	}
	const result = await service.create(data);
	revalidatePath('/registry/certificate-reprints');
	revalidatePath(`/registry/students/${data.stdNo}`);
	return result;
}

export async function updateCertificateReprint(
	id: string,
	data: CertificateReprintUpdate
) {
	const result = await service.update(id, data);
	if (result?.stdNo) {
		revalidatePath(`/registry/students/${result.stdNo}`);
	}
	return result;
}

export async function deleteCertificateReprint(id: string) {
	return service.delete(id);
}
