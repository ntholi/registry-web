import { Badge } from '@mantine/core';
import type { semesterStatus } from '@/core/database/schema';

type SemesterStatus = (typeof semesterStatus.enumValues)[number];

type Props = {
	status: SemesterStatus;
};

export default function SemesterStatusView({ status }: Props) {
	const getColor = (status: SemesterStatus) => {
		switch (status) {
			case 'Active':
			case 'Enrolled':
				return 'gray';
			case 'Outstanding':
				return 'dark';
			case 'Deleted':
			case 'Inactive':
			case 'DNR':
			case 'DroppedOut':
				return 'red';
			case 'Deferred':
				return 'yellow';
			case 'Exempted':
				return 'blue';
			case 'Repeat':
				return 'violet';
			default:
				return 'gray';
		}
	};

	return (
		<Badge color={getColor(status)} size='sm'>
			{status}
		</Badge>
	);
}
