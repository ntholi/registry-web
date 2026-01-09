import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
	dotenv.config({ path: envLocalPath });
	console.log(`Loaded environment from ${envLocalPath}`);
} else {
	dotenv.config();
	console.log('Loaded environment from .env');
}

async function main() {
	console.log('🚀 Starting database seed...');

	try {
		const { seedSubjects } = await import('./seeds/subjects');
		await seedSubjects();
		console.log('🎉 Database seeding completed successfully.');
	} catch (error) {
		console.error('❌ Database seeding failed:', error);
		process.exit(1);
	}
	process.exit(0);
}

main();
