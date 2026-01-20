import type { DocumentType } from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';

export function mapDocumentTypeFromAnalysis(
	result: DocumentAnalysisResult
): DocumentType {
	if (result.category === 'identity') {
		return result.documentType === 'passport_photo'
			? 'passport_photo'
			: 'identity';
	}
	if (result.category === 'academic') {
		switch (result.documentType) {
			case 'certificate':
				return 'certificate';
			case 'transcript':
				return 'transcript';
			case 'academic_record':
				return 'academic_record';
			case 'recommendation_letter':
				return 'recommendation_letter';
			default:
				return 'certificate';
		}
	}
	if (result.category === 'other') {
		switch (result.documentType) {
			case 'proof_of_payment':
				return 'proof_of_payment';
			case 'personal_statement':
				return 'personal_statement';
			case 'medical_report':
				return 'medical_report';
			case 'enrollment_letter':
				return 'enrollment_letter';
			case 'clearance_form':
				return 'clearance_form';
			default:
				return 'other';
		}
	}
	return 'other';
}
