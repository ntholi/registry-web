import { recognizedSchools } from '@/app/admissions/_database';
import { db } from '../index';

export async function seedRecognizedSchools() {
	console.log('🌱 Seeding recognized schools...');

	const schools: { name: string }[] = [
		{ name: 'Limkokwing University of Creative Technology' },
		{ name: 'Lerotholi Polytechnic' },
		{ name: 'National University of Lesotho' },
		{ name: 'Institute of Development Management' },
		{ name: 'Botho University' },
		{ name: 'Machabeng International College' },
		{ name: 'National Health Training Centre' },
		{ name: 'Lesotho College of Education' },
	];

	await db.insert(recognizedSchools).values(schools).onConflictDoNothing();

	console.log(`✅ Seeded ${schools.length} recognized schools.`);
}
