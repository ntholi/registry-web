import { programs } from '@academic/schools/_schema/programs';
import { certificateTypes } from '@admissions/certificate-types/_schema/certificateTypes';
import { relations } from 'drizzle-orm';
import { entryRequirements } from './entryRequirements';

export const entryRequirementsRelations = relations(
	entryRequirements,
	({ one }) => ({
		program: one(programs, {
			fields: [entryRequirements.programId],
			references: [programs.id],
		}),
		certificateType: one(certificateTypes, {
			fields: [entryRequirements.certificateTypeId],
			references: [certificateTypes.id],
		}),
	})
);
