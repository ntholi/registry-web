'use client';

import { Group, Progress, Text } from '@mantine/core';

type Props = {
	current: number;
	total: number;
	completedCount: number;
};

export default function LecturerProgress({
	current,
	total,
	completedCount,
}: Props) {
	const pct = total > 0 ? (completedCount / total) * 100 : 0;

	return (
		<div>
			<Group justify='space-between' mb={4}>
				<Text size='sm' fw={500}>
					Lecturer {current} of {total}
				</Text>
				<Text size='xs' c='dimmed'>
					{completedCount} completed
				</Text>
			</Group>
			<Progress value={pct} size='sm' radius='xl' />
		</div>
	);
}
