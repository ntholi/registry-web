import { eq } from 'drizzle-orm';
import { db, schools } from '@/core/database';

export async function seedSchools() {
	console.log('🌱 Updating school short names...');

	const data = [
		{ code: 'FABE', shortName: 'Architecture' },
		{ code: 'FBMG', shortName: 'Business' },
		{ code: 'FCM', shortName: 'Communication' },
		{ code: 'FCTH', shortName: 'Tourism' },
		{ code: 'FDI', shortName: 'Design' },
		{ code: 'FFLD', shortName: 'Fashion' },
		{ code: 'FFTB', shortName: 'Film' },
		{ code: 'FICT', shortName: 'Technology' },
	];

	for (const { code, shortName } of data) {
		await db.update(schools).set({ shortName }).where(eq(schools.code, code));
	}
}
