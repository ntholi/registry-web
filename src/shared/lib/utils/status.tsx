import {
	IconCircleCheck,
	IconClock,
	IconExclamationCircle,
} from '@tabler/icons-react';
import { getStatusColor } from './colors';

export type StatusType =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'confirmed'
	| 'partial'
	| 'registered';

export type StatusIconSize = '1rem' | 16 | 20 | 24;

export function getStatusIcon(
	status: StatusType,
	options?: { size?: StatusIconSize; withColor?: boolean }
) {
	const { size = '1rem', withColor = false } = options || {};
	const color = withColor ? getStatusColor(status) : undefined;

	switch (status) {
		case 'approved':
		case 'confirmed':
		case 'registered':
			return <IconCircleCheck size={size} color={color} />;
		case 'rejected':
			return <IconExclamationCircle size={size} color={color} />;
		default:
			return <IconClock size={size} color={color} />;
	}
}
