import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
	dotenv.config({ path: envLocalPath });
} else {
	dotenv.config();
}
