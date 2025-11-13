'use client';

import { Badge, Card, Group, Stack, Text } from '@mantine/core';

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
	const score =
		assignedGrade !== null && assignedGrade !== undefined
			? assignedGrade
			: draftGrade !== null && draftGrade !== undefined
				? draftGrade
				: null;

	return (
		<Card withBorder p='md' radius='lg'>
			<Group justify='space-between' align='flex-start'>
				<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
					<Text size='sm' fw={600} truncate>
						{userId || 'Student'}
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
				</Stack>

				{score !== null ? (
					<Stack gap='4px' align='flex-end'>
						<Text size='lg' fw={700} c='blue'>
							{score}
						</Text>
						{maxPoints !== null && maxPoints !== undefined && (
							<Text size='xs' c='dimmed'>
								of {maxPoints}
							</Text>
						)}
					</Stack>
				) : (
					<Text size='sm' c='dimmed'>
						Awaiting submission
					</Text>
				)}
			</Group>
		</Card>
	);
}
