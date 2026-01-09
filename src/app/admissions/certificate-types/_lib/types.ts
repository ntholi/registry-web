import type { certificateTypes, gradeMappings } from '@/core/database';

export type CertificateType = typeof certificateTypes.$inferSelect;
export type CertificateTypeInsert = typeof certificateTypes.$inferInsert;
export type GradeMapping = typeof gradeMappings.$inferSelect;
export type GradeMappingInsert = typeof gradeMappings.$inferInsert;

export type CertificateTypeWithMappings = CertificateType & {
	gradeMappings: GradeMapping[];
};
