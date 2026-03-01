import {
	IconCircleCheck,
	IconClock,
	IconExclamationCircle,
	IconUserMinus,
	IconUserPause,
	IconUserPlus,
} from '@tabler/icons-react';
import { type AllStatusType, getStatusColor } from './colors';

export type StatusType =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'cancelled'
	| 'confirmed'
	| 'partial'
	| 'registered';

export type StatusIconSize = '1rem' | 14 | 16 | 20 | 24;

export function getStatusIcon(
	status: StatusType,
	options?: { size?: StatusIconSize; withColor?: boolean }
) {
	const { size = '1rem', withColor = false } = options || {};
	const color = withColor ? getStatusColor(status as AllStatusType) : undefined;

	switch (status) {
		case 'approved':
		case 'confirmed':
		case 'registered':
			return <IconCircleCheck size={size} color={color} />;
		case 'rejected':
		case 'cancelled':
			return <IconExclamationCircle size={size} color={color} />;
		default:
			return <IconClock size={size} color={color} />;
	}
}

export type ApplicationType = 'withdrawal' | 'deferment' | 'reinstatement';

export function getApplicationTypeIcon(
	type: ApplicationType,
	options?: { size?: StatusIconSize }
) {
	const { size = '1rem' } = options || {};
	switch (type) {
		case 'withdrawal':
			return <IconUserMinus size={size} />;
		case 'deferment':
			return <IconUserPause size={size} />;
		case 'reinstatement':
			return <IconUserPlus size={size} />;
	}
}
