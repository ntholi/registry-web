import { relations } from 'drizzle-orm';
import { recognizedSchools } from './recognizedSchools';

export const recognizedSchoolsRelations = relations(
	recognizedSchools,
	() => ({})
);
