import type { ApplicationStatus, PaymentStatus } from '@/core/database';

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

type DepositInfo = {
	bankDeposits: { id: string; status: string }[];
	mobileDeposits: { id: string; status: string }[];
};

export function getOverallStatusSummary(
	status: ApplicationStatus,
	paymentStatus: PaymentStatus,
	deposits: DepositInfo
): string {
	if (status === 'draft') {
		return 'Application not yet submitted — complete and submit your application';
	}
	if (status === 'rejected') {
		return 'Your application was not successful';
	}
	if (status === 'waitlisted') {
		return 'You have been placed on the waitlist';
	}
	if (
		status === 'accepted_first_choice' ||
		status === 'accepted_second_choice'
	) {
		return 'Congratulations! You have been accepted';
	}
	if (status === 'under_review') {
		return 'Your application is being reviewed';
	}

	const hasDeposits =
		deposits.bankDeposits.length > 0 || deposits.mobileDeposits.length > 0;

	if (status === 'submitted' && paymentStatus === 'unpaid') {
		if (hasDeposits) {
			return 'Application submitted — payment under review';
		}
		return 'Payment required';
	}

	if (status === 'submitted' && paymentStatus === 'paid') {
		return 'Payment confirmed — application to be reviewed';
	}

	return 'Application submitted';
}

export function getOverallStatusColor(
	status: ApplicationStatus,
	paymentStatus: PaymentStatus,
	deposits: DepositInfo
): string {
	if (status === 'draft') return 'gray';
	if (status === 'rejected') return 'red';
	if (status === 'waitlisted') return 'orange';
	if (status === 'accepted_first_choice' || status === 'accepted_second_choice')
		return 'green';
	if (status === 'under_review') return 'yellow';

	const hasDeposits =
		deposits.bankDeposits.length > 0 || deposits.mobileDeposits.length > 0;

	if (status === 'submitted' && paymentStatus === 'unpaid') {
		return hasDeposits ? 'blue' : 'red';
	}
	if (status === 'submitted' && paymentStatus === 'paid') {
		return 'teal';
	}

	return 'blue';
}
