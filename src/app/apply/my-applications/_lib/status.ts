import type { ApplicationStatus } from '@/core/database';

export function getStatusColor(status: ApplicationStatus): string {
	const colors: Record<ApplicationStatus, string> = {
		draft: 'gray',
		submitted: 'blue',
		under_review: 'yellow',
		accepted_first_choice: 'green',
		accepted_second_choice: 'teal',
		rejected: 'red',
		waitlisted: 'orange',
	};
	return colors[status];
}

export function getStatusLabel(status: ApplicationStatus): string {
	const labels: Record<ApplicationStatus, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		under_review: 'Under Review',
		accepted_first_choice: 'Accepted (1st Choice)',
		accepted_second_choice: 'Accepted (2nd Choice)',
		rejected: 'Rejected',
		waitlisted: 'Waitlisted',
	};
	return labels[status];
}
