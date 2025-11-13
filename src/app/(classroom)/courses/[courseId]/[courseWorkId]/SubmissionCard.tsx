'use client';

import { Badge, Box, Card, Group, Text } from '@mantine/core';

type Props = {
	userId: string | null | undefined;
	state: string | null | undefined;
	late: boolean | null | undefined;
	assignedGrade: number | null | undefined;
	draftGrade: number | null | undefined;
	maxPoints: number | null | undefined;
};

function getStateColor(state: string | null | undefined) {
	switch (state) {
		case 'NEW':
			return 'yellow';
		case 'TURNED_IN':
			return 'blue';
		case 'RETURNED':
			return 'green';
		default:
			return 'gray';
	}
}

function getStateLabel(state: string | null | undefined) {
	switch (state) {
		case 'NEW':
			return 'Assigned';
		case 'TURNED_IN':
			return 'Turned in';
		case 'RETURNED':
			return 'Graded';
		default:
			return 'Not started';
	}
}

export default function SubmissionCard({
	userId,
	state,
	late,
	assignedGrade,
	draftGrade,
	maxPoints,
}: Props) {
	return (
		<Card withBorder p='md' radius='sm'>
			<Group justify='space-between' wrap='nowrap'>
				<Box style={{ flex: 1, minWidth: 0 }}>
					<Text size='sm' fw={500} mb='xs' truncate>
						{userId}
					</Text>
					<Group gap='xs'>
						<Badge size='sm' variant='light' color={getStateColor(state)}>
							{getStateLabel(state)}
						</Badge>
						{late && (
							<Badge size='sm' color='red' variant='light'>
								Late
							</Badge>
						)}
					</Group>
				</Box>

				{(assignedGrade !== null && assignedGrade !== undefined) ||
				draftGrade !== null ? (
					<Box style={{ textAlign: 'right' }}>
						<Text size='xl' fw={700} c='blue'>
							{assignedGrade ?? draftGrade}
						</Text>
						<Text size='xs' c='dimmed'>
							/ {maxPoints}
						</Text>
					</Box>
				) : (
					<Text size='sm' c='dimmed'>
						—
					</Text>
				)}
			</Group>
		</Card>
	);
}
