import { subjects } from '@/app/admissions/_database';
import { db } from '../index';

export async function seedSubjects() {
	console.log('🌱 Seeding subjects...');

	const subjectList = [
		'English Language',
		'Mathematics',
		'Sesotho',
		'Science (Double Award)',
		'Physical Science',
		'Biology',
		'Chemistry',
		'Physics',
		'Combined Science',
		'Additional Mathematics',
		'Statistics',
		'Literature in English',
		'Geography',
		'History',
		'Religious Studies',
		'Development Studies',
		'Agriculture',
		'Accounting',
		'Business Studies',
		'Economics',
		'Computer Studies',
		'Information and Communication Technology (ICT)',
		'Design and Technology',
		'Food and Nutrition',
		'Fashion and Fabrics',
		'Travel and Tourism',
		'Physical Education',
		'French',
		'Music',
		'Drama',
		'Art',
		'Woodwork',
		'Home Economics',
		'Art and Design',
		'Technical Drawing',
		'Needlework',
		'Bricklaying',
		'Commerce',
	];

	const values = subjectList.map((name) => ({
		name,
		isActive: true,
	}));

	await db.insert(subjects).values(values).onConflictDoNothing();

	console.log(`✅ Seeded ${values.length} subjects (skipped duplicates).`);
}
