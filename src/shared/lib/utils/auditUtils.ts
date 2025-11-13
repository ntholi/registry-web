export function generateAssessmentMarkAuditMessage(
	action: 'create' | 'update' | 'delete',
	previousMarks?: number | null,
	newMarks?: number | null,
	assessmentType?: string
): string {
	const typeLabel = assessmentType || 'Assessment';

	switch (action) {
		case 'create':
			return `${typeLabel} mark created with value ${newMarks}`;
		case 'update':
			return `${typeLabel} mark updated from ${previousMarks} to ${newMarks}`;
		case 'delete':
			return `${typeLabel} mark deleted (was ${previousMarks})`;
		default:
			return `${typeLabel} mark modified`;
	}
}

export function generateAssessmentAuditMessage(
	action: 'create' | 'update' | 'delete',
	changes: {
		previousAssessmentNumber?: string | null;
		newAssessmentNumber?: string | null;
		previousAssessmentType?: string | null;
		newAssessmentType?: string | null;
		previousTotalMarks?: number | null;
		newTotalMarks?: number | null;
		previousWeight?: number | null;
		newWeight?: number | null;
	}
): string {
	const {
		previousAssessmentNumber,
		newAssessmentNumber,
		previousAssessmentType,
		newAssessmentType,
		previousTotalMarks,
		newTotalMarks,
		previousWeight,
		newWeight,
	} = changes;

	switch (action) {
		case 'create':
			return `Assessment created: ${newAssessmentNumber} (${newAssessmentType}) with ${newTotalMarks} marks and ${newWeight}% weight`;
		case 'update': {
			const changeDetails = [];

			if (previousAssessmentNumber !== newAssessmentNumber) {
				changeDetails.push(
					`number from ${previousAssessmentNumber} to ${newAssessmentNumber}`
				);
			}

			if (previousAssessmentType !== newAssessmentType) {
				changeDetails.push(
					`type from ${previousAssessmentType} to ${newAssessmentType}`
				);
			}

			if (previousTotalMarks !== newTotalMarks) {
				changeDetails.push(
					`total marks from ${previousTotalMarks} to ${newTotalMarks}`
				);
			}

			if (previousWeight !== newWeight) {
				changeDetails.push(`weight from ${previousWeight}% to ${newWeight}%`);
			}

			if (changeDetails.length === 0) {
				return 'Assessment updated (no significant changes)';
			}

			return `Assessment updated: ${changeDetails.join(', ')}`;
		}
		case 'delete':
			return `Assessment deleted: ${previousAssessmentNumber} (${previousAssessmentType}) with ${previousTotalMarks} marks and ${previousWeight}% weight`;
		default:
			return 'Assessment modified';
	}
}

export function formatAuditDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	}).format(date);
}
