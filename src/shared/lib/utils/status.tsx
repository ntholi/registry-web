import {
	IconCircleCheck,
	IconClock,
	IconExclamationCircle,
} from '@tabler/icons-react';

export type StatusType =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'confirmed'
	| 'partial'
	| 'registered';

export function getStatusIcon(status: StatusType) {
	switch (status) {
		case 'approved':
		case 'confirmed':
		case 'registered':
			return <IconCircleCheck size='1rem' />;
		case 'rejected':
			return <IconExclamationCircle size='1rem' />;
		default:
			return <IconClock size='1rem' />;
	}
}
