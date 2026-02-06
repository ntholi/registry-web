import './env-load';
import { seedCertificateTypes } from './seeds/certificate-types';
import { seedEntryRequirements } from './seeds/entry-requirements';
import { seedGradeMappings } from './seeds/grade-mappings';
import { seedRecognizedSchools } from './seeds/recognized-schools';
import { seedSchools } from './seeds/schools';
import { seedSubjects } from './seeds/subjects';

async function main() {
	console.log('🚀 Starting database seed...');

	try {
		await seedSubjects();
		await seedRecognizedSchools();
		await seedCertificateTypes();
		await seedGradeMappings();
		await seedEntryRequirements();
		await seedSchools();

		console.log('🎉 Database seeding completed successfully.');
	} catch (error) {
		console.error('❌ Database seeding failed:', error);
		process.exit(1);
	}
	process.exit(0);
}

main();
