import { relations } from 'drizzle-orm';
import { certificateTypes, programs } from '@/core/database';
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
