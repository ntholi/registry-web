import { certificateTypes } from '@/app/admissions/_database';
import { db } from '../index';

export async function seedCertificateTypes() {
	console.log('🌱 Seeding certificate types...');

	const types = [
		{
			name: 'LGCSE',
			description: 'Lesotho General Certificate of Secondary Education',
			lqfLevel: 4,
		},
		{
			name: 'COSC',
			description: 'Cambridge Overseas School Certificate',
			lqfLevel: 4,
		},
		{
			name: 'NSC',
			description: 'National Senior Certificate (South Africa)',
			lqfLevel: 4,
		},
		{
			name: 'IGCSE',
			description: 'International General Certificate of Secondary Education',
			lqfLevel: 4,
		},
		{
			name: 'GCE O-Level',
			description: 'General Certificate of Education Ordinary Level',
			lqfLevel: 4,
		},
		{
			name: 'AS Level',
			description: 'Advanced Subsidiary Level',
			lqfLevel: 5,
		},
		{
			name: 'A Level',
			description: 'Advanced Level',
			lqfLevel: 6,
		},
		{
			name: 'IB Diploma',
			description: 'International Baccalaureate Diploma',
			lqfLevel: 4,
		},
	];

	// No need to map createdAt/updatedAt manually as they have defaultNow(), unless we want explicit sync
	await db.insert(certificateTypes).values(types).onConflictDoNothing();

	console.log(
		`✅ Seeded ${types.length} certificate types (skipped duplicates).`
	);
}
