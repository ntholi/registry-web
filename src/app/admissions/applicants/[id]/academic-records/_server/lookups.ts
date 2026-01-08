'use server';

import { eq } from 'drizzle-orm';
import { db, subjects } from '@/core/database';

export async function getActiveSubjects() {
	return db.query.subjects.findMany({
		where: eq(subjects.isActive, true),
		orderBy: (s, { asc }) => [asc(s.name)],
	});
}

export async function getCertificateTypesForRecords() {
	return db.query.certificateTypes.findMany({
		orderBy: (ct, { asc }) => [asc(ct.name)],
		with: { gradeMappings: true },
	});
}
