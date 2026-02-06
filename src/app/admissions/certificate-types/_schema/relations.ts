import { academicRecords } from '@admissions/academic-records/_schema/academicRecords';
import { entryRequirements } from '@admissions/entry-requirements/_schema/entryRequirements';
import { relations } from 'drizzle-orm';
import { certificateTypes, gradeMappings } from './certificateTypes';

export const certificateTypesRelations = relations(
	certificateTypes,
	({ many }) => ({
		gradeMappings: many(gradeMappings),
		academicRecords: many(academicRecords),
		entryRequirements: many(entryRequirements),
	})
);

export const gradeMappingsRelations = relations(gradeMappings, ({ one }) => ({
	certificateType: one(certificateTypes, {
		fields: [gradeMappings.certificateTypeId],
		references: [certificateTypes.id],
	}),
}));
