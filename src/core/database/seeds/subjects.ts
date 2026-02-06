import { eq } from 'drizzle-orm';
import { subjectAliases, subjects } from '@/app/admissions/_database';
import { db } from '../index';

const subjectsWithAliases: { name: string; aliases: string[] }[] = [
	{
		name: 'English Language',
		aliases: [
			'English',
			'English First Language',
			'English Second Language',
			'English Home Language',
			'English First Additional Language',
			'English FAL',
			'English HL',
			'English as a Second Language',
			'English (First Language)',
			'English (Second Language)',
		],
	},
	{
		name: 'Mathematics',
		aliases: [
			'Maths',
			'Math',
			'Pure Mathematics',
			'Mathematics (Core)',
			'Mathematics Core',
			'Core Mathematics',
			'Mathematical Literacy',
			'Maths Literacy',
			'Mathematics A',
		],
	},
	{
		name: 'Sesotho',
		aliases: [
			'Sesotho First Language',
			'Sesotho Second Language',
			'Sesotho Home Language',
			'Sesotho First Additional Language',
			'Sesotho HL',
			'Sesotho FAL',
			'Southern Sotho',
		],
	},
	{
		name: 'Science (Double Award)',
		aliases: [
			'Double Award Science',
			'Coordinated Science',
			'Coordinated Sciences',
			'Double Science',
			'Science Double Award',
			'Integrated Science (Double Award)',
		],
	},
	{
		name: 'Physical Science',
		aliases: [
			'Physical Sciences',
			'Physic Science',
			'Physical Science (Physics)',
			'Physical Science (Chemistry)',
		],
	},
	{
		name: 'Biology',
		aliases: [
			'Life Sciences',
			'Life Science',
			'Human Biology',
			'Biological Sciences',
			'Biological Science',
			'Human and Social Biology',
		],
	},
	{
		name: 'Chemistry',
		aliases: ['Chem', 'Chemical Science', 'Chemistry (Pure)'],
	},
	{
		name: 'Physics',
		aliases: ['Phys', 'Physics (Pure)', 'Applied Physics'],
	},
	{
		name: 'Combined Science',
		aliases: [
			'Single Award Science',
			'Science (Single Award)',
			'Integrated Science',
			'General Science',
			'Natural Sciences',
			'Natural Science',
		],
	},
	{
		name: 'Additional Mathematics',
		aliases: [
			'Add Maths',
			'Additional Maths',
			'A-Maths',
			'Advanced Mathematics',
			'Further Mathematics',
			'Mathematics (Extended)',
		],
	},
	{
		name: 'Statistics',
		aliases: ['Stats', 'Mathematical Statistics', 'Applied Statistics'],
	},
	{
		name: 'Literature in English',
		aliases: [
			'English Literature',
			'Literature',
			'Lit in English',
			'English Lit',
			'Literature (English)',
		],
	},
	{
		name: 'Geography',
		aliases: [
			'Geog',
			'Physical Geography',
			'Human Geography',
			'Environmental Geography',
		],
	},
	{
		name: 'History',
		aliases: ['Hist', 'Modern History', 'World History', 'African History'],
	},
	{
		name: 'Religious Studies',
		aliases: [
			'Religious Education',
			'Religion Studies',
			'RE',
			'RS',
			'Bible Studies',
			'Bible Knowledge',
			'Divinity',
			'Religion',
		],
	},
	{
		name: 'Development Studies',
		aliases: [
			'Dev Studies',
			'Development Study',
			'Social Development',
			'Community Development',
		],
	},
	{
		name: 'Agriculture',
		aliases: [
			'Agricultural Science',
			'Agricultural Sciences',
			'Agric',
			'Agricultural Studies',
			'Agriculture Science',
			'Agri-Science',
		],
	},
	{
		name: 'Accounting',
		aliases: [
			'Principles of Accounting',
			'Principles of Accounts',
			'Accounts',
			'Financial Accounting',
			'Book Keeping',
			'Bookkeeping',
			'Accountancy',
			'Financial Literacy',
		],
	},
	{
		name: 'Business Studies',
		aliases: [
			'Business',
			'Business Management',
			'Business Education',
			'Business Administration',
			'Introduction to Business',
		],
	},
	{
		name: 'Economics',
		aliases: [
			'Econs',
			'Economic Studies',
			'Basic Economics',
			'Principles of Economics',
		],
	},
	{
		name: 'Computer Studies',
		aliases: [
			'Computer Science',
			'Computing',
			'Computer Literacy',
			'Computer Applications',
			'Computers',
			'Information Technology',
			'IT',
		],
	},
	{
		name: 'Information and Communication Technology (ICT)',
		aliases: [
			'ICT',
			'Information Technology',
			'Computer Applications Technology',
			'CAT',
			'Information and Communication Technology',
			'Info Tech',
		],
	},
	{
		name: 'Design and Technology',
		aliases: [
			'Design & Technology',
			'D&T',
			'DT',
			'Design Technology',
			'Design Studies',
			'Technology',
		],
	},
	{
		name: 'Food and Nutrition',
		aliases: [
			'Food & Nutrition',
			'Nutrition',
			'Consumer Studies',
			'Food Technology',
			'Foods',
			'Food Studies',
		],
	},
	{
		name: 'Fashion and Fabrics',
		aliases: [
			'Fashion & Fabrics',
			'Clothing and Textiles',
			'Textiles',
			'Fashion Studies',
			'Fashion Design',
			'Clothing',
			'Textile Technology',
		],
	},
	{
		name: 'Travel and Tourism',
		aliases: [
			'Travel & Tourism',
			'Tourism',
			'Hospitality Studies',
			'Tourism Studies',
			'Hospitality and Tourism',
		],
	},
	{
		name: 'Physical Education',
		aliases: [
			'PE',
			'Phys Ed',
			'Sport Science',
			'Sports Science',
			'Life Orientation',
			'LO',
			'Health and Physical Education',
		],
	},
	{
		name: 'French',
		aliases: [
			'French Language',
			'French First Additional Language',
			'French Second Additional Language',
			'French FAL',
		],
	},
	{
		name: 'Music',
		aliases: ['Musical Arts', 'Music Studies', 'Performing Arts (Music)'],
	},
	{
		name: 'Drama',
		aliases: [
			'Dramatic Arts',
			'Theatre Studies',
			'Theatre Arts',
			'Performing Arts (Drama)',
			'Drama Studies',
		],
	},
	{
		name: 'Art',
		aliases: ['Fine Art', 'Fine Arts', 'Arts', 'Visual Art', 'Visual Arts'],
	},
	{
		name: 'Woodwork',
		aliases: [
			'Wood Technology',
			'Woodworking',
			'Carpentry',
			'Wood Work',
			'Woodwork Technology',
		],
	},
	{
		name: 'Home Economics',
		aliases: [
			'Home Management',
			'Consumer Studies',
			'Home Science',
			'Domestic Science',
			'Family and Consumer Sciences',
		],
	},
	{
		name: 'Art and Design',
		aliases: [
			'Art & Design',
			'Design Arts',
			'Visual Art and Design',
			'Creative Arts',
			'Graphic Design',
		],
	},
	{
		name: 'Technical Drawing',
		aliases: [
			'Technical Graphics',
			'Engineering Graphics and Design',
			'EGD',
			'Geometrical and Mechanical Drawing',
			'Technical Graphics and Design',
			'Mechanical Drawing',
			'Engineering Drawing',
		],
	},
	{
		name: 'Needlework',
		aliases: [
			'Needlework and Clothing',
			'Sewing',
			'Textile Design',
			'Embroidery',
			'Clothing Construction',
		],
	},
	{
		name: 'Bricklaying',
		aliases: [
			'Bricklaying and Plastering',
			'Masonry',
			'Building Construction',
			'Brick and Block Laying',
		],
	},
	{
		name: 'Commerce',
		aliases: [
			'Commercial Studies',
			'Commercial Subjects',
			'Business Commerce',
			'Introduction to Commerce',
		],
	},
	{
		name: 'Entrepreneurship',
		aliases: [
			'Entrepreneurial Studies',
			'Business Entrepreneurship',
			'Enterprise Studies',
			'Small Business Management',
		],
	},
	{
		name: 'Metalwork',
		aliases: [
			'Metal Technology',
			'Metalworking',
			'Metal Work',
			'Sheet Metal Work',
			'Engineering Technology',
		],
	},
	{
		name: 'Building Science',
		aliases: [
			'Building Studies',
			'Construction Studies',
			'Civil Technology',
			'Building Technology',
		],
	},
	{
		name: 'Religious Education',
		aliases: [
			'Religious Studies',
			'Religion Education',
			'Bible Education',
			'Moral Education',
			'Religious Knowledge',
		],
	},
	{
		name: 'Setswana',
		aliases: [
			'Setswana First Language',
			'Setswana Second Language',
			'Setswana Home Language',
			'Setswana First Additional Language',
			'Setswana HL',
			'Setswana FAL',
			'Tswana',
		],
	},
	{
		name: 'Afrikaans',
		aliases: [
			'Afrikaans First Language',
			'Afrikaans Second Language',
			'Afrikaans Home Language',
			'Afrikaans First Additional Language',
			'Afrikaans HL',
			'Afrikaans FAL',
		],
	},
	{
		name: 'siSwati',
		aliases: [
			'siSwati First Language',
			'siSwati Second Language',
			'siSwati Home Language',
			'siSwati First Additional Language',
			'SiSwati',
			'Swati',
			'Swazi',
		],
	},
	{
		name: 'IsiZulu',
		aliases: [
			'IsiZulu First Language',
			'IsiZulu Second Language',
			'IsiZulu Home Language',
			'IsiZulu First Additional Language',
			'IsiZulu HL',
			'IsiZulu FAL',
			'Zulu',
		],
	},
	{
		name: 'IsiXhosa',
		aliases: [
			'IsiXhosa First Language',
			'IsiXhosa Second Language',
			'IsiXhosa Home Language',
			'IsiXhosa First Additional Language',
			'IsiXhosa HL',
			'IsiXhosa FAL',
			'Xhosa',
		],
	},
	{
		name: 'Sepedi',
		aliases: [
			'Sepedi First Language',
			'Sepedi Second Language',
			'Sepedi Home Language',
			'Sepedi First Additional Language',
			'Sepedi HL',
			'Sepedi FAL',
			'Northern Sotho',
		],
	},
];

export async function seedSubjects() {
	console.log('🌱 Seeding subjects...');

	const subjectValues = subjectsWithAliases.map(({ name }) => ({
		name,
		isActive: true,
	}));

	await db.insert(subjects).values(subjectValues).onConflictDoNothing();
	console.log(
		`✅ Seeded ${subjectValues.length} subjects (skipped duplicates).`
	);

	console.log('🌱 Seeding subject aliases...');

	let aliasCount = 0;
	for (const { name, aliases } of subjectsWithAliases) {
		const [subject] = await db
			.select({ id: subjects.id })
			.from(subjects)
			.where(eq(subjects.name, name));

		if (!subject) continue;

		const aliasValues = aliases.map((alias) => ({
			subjectId: subject.id,
			alias,
		}));

		if (aliasValues.length > 0) {
			await db.insert(subjectAliases).values(aliasValues).onConflictDoNothing();
			aliasCount += aliasValues.length;
		}
	}

	console.log(`✅ Seeded ${aliasCount} subject aliases (skipped duplicates).`);
}
