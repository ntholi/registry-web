'use client';

import { statusColors } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	{
		value: 'pending',
		label: 'Pending',
		color: statusColors.mailQueueStatus.pending,
	},
	{
		value: 'processing',
		label: 'Processing',
		color: statusColors.mailQueueStatus.processing,
	},
	{ value: 'sent', label: 'Sent', color: statusColors.mailQueueStatus.sent },
	{
		value: 'failed',
		label: 'Failed',
		color: statusColors.mailQueueStatus.failed,
	},
	{
		value: 'retry',
		label: 'Retry',
		color: statusColors.mailQueueStatus.retry,
	},
];

export default function QueueStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='all'
			options={options}
		/>
	);
}
