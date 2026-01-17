import { certificateTypes, type GradingType } from '@/app/admissions/_database';
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
			description: 'National Senior Certificate (South Africa)',
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
			description:
				'General Certificate of Education Advanced Subsidiary Level (grades A-E)',
			lqfLevel: 5,
			gradingType: 'subject-grades',
		},
		{
			name: 'GCE A-Level',
			description:
				'General Certificate of Education Advanced Level (grades A*-E)',
			lqfLevel: 5,
			gradingType: 'subject-grades',
		},
		{
			name: 'Certificate',
			description: 'Post-secondary Certificate (Distinction/Merit/Credit/Pass)',
			lqfLevel: 6,
			gradingType: 'classification',
		},
		{
			name: 'Diploma',
			description: 'Post-secondary Diploma (Distinction/Merit/Credit/Pass)',
			lqfLevel: 6,
			gradingType: 'classification',
		},
		{
			name: 'Higher Diploma',
			description:
				'Post-secondary Higher Diploma (Distinction/Merit/Credit/Pass)',
			lqfLevel: 7,
			gradingType: 'classification',
		},
		{
			name: 'Bachelor Degree',
			description: 'Undergraduate Degree (Distinction/Merit/Credit/Pass)',
			lqfLevel: 8,
			gradingType: 'classification',
		},
	];

	await db.insert(certificateTypes).values(types).onConflictDoNothing();

	console.log(
		`✅ Seeded ${types.length} certificate types (skipped duplicates).`
	);
}
