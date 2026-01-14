import { certificateTypes } from '@/app/admissions/_database';
import type { GradingType } from '@/app/admissions/_database/schema/enums';
import { db } from '../index';

export async function seedCertificateTypes() {
	console.log('🌱 Seeding certificate types...');

	const types: {
		name: string;
		description: string;
		lqfLevel: number;
		gradingType: GradingType;
	}[] = [
		{
			name: 'LGCSE',
			description: 'Lesotho General Certificate of Secondary Education',
			lqfLevel: 4,
			gradingType: 'subject-grades',
		},
		{
			name: 'COSC',
			description: 'Cambridge Overseas School Certificate',
			lqfLevel: 4,
			gradingType: 'subject-grades',
		},
		{
			name: 'NSC',
			description: 'National Senior Certificate (Matric)',
			lqfLevel: 4,
			gradingType: 'subject-grades',
		},
		{
			name: 'IGCSE',
			description: 'International General Certificate of Secondary Education',
			lqfLevel: 4,
			gradingType: 'subject-grades',
		},
		{
			name: 'GCE O-Level',
			description: 'General Certificate of Education Ordinary Level',
			lqfLevel: 4,
			gradingType: 'subject-grades',
		},
		{
			name: 'GCE AS Level',
			description: 'General Certificate of Education Advanced Subsidiary Level',
			lqfLevel: 5,
			gradingType: 'subject-grades',
		},
		{
			name: 'GCE A-Level',
			description: 'General Certificate of Education Advanced Level',
			lqfLevel: 5,
			gradingType: 'subject-grades',
		},
		{
			name: 'Certificate',
			description: 'Relevant Certificate',
			lqfLevel: 5,
			gradingType: 'classification',
		},
		{
			name: 'Diploma',
			description: 'Relevant Diploma',
			lqfLevel: 6,
			gradingType: 'classification',
		},
	];

	await db.insert(certificateTypes).values(types).onConflictDoNothing();

	console.log(
		`✅ Seeded ${types.length} certificate types (skipped duplicates).`
	);
}
