'use client';

import { Badge } from '@mantine/core';
import {
	type ApplicationStatusType,
	getApplicationStatusColor,
} from '@/shared/lib/utils/colors';

type Props = {
	status: ApplicationStatusType;
};

export const statusLabels: Record<ApplicationStatusType, string> = {
	draft: 'Draft',
	submitted: 'Submitted',
	under_review: 'Under Review',
	underreview: 'Under Review',
	accepted_first_choice: 'Accepted (1st)',
	acceptedfirstchoice: 'Accepted (1st)',
	accepted_second_choice: 'Accepted (2nd)',
	acceptedsecondchoice: 'Accepted (2nd)',
	rejected: 'Rejected',
	waitlisted: 'Waitlisted',
};

export default function StatusBadge({ status }: Props) {
	const color = getApplicationStatusColor(status);
	const label = statusLabels[status] || status;

	return (
		<Badge color={color} variant='light'>
			{label}
		</Badge>
	);
}
