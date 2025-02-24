import 'dotenv/config';
import { db } from '@/db';
import { modules, semesterModules } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Copying semesterId from semesterModules to modules table...');

    await db.transaction(async (tx) => {
      const semesterModulesData = await tx
        .select({
          moduleId: semesterModules.moduleId,
          semesterId: semesterModules.semesterId,
        })
        .from(semesterModules);

      console.log(
        `Found ${semesterModulesData.length} entries in semesterModules table`,
      );

      let updatedCount = 0;
      for (const record of semesterModulesData) {
        await tx
          .update(modules)
          .set({
            semesterId: record.semesterId,
          })
          .where(sql`${modules.id} = ${record.moduleId}`);
        updatedCount++;
      }

      console.log(
        `Successfully updated semesterId for ${updatedCount} modules`,
      );
    });

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    console.log('Database connection closed');
  }
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error in migration script:', err);
    process.exit(1);
  });
