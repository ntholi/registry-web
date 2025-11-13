'use client';

import { Badge, Box, Card, Group, Text } from '@mantine/core';
import { IconPointFilled, IconUser } from '@tabler/icons-react';

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
		case 'CREATED':
			return 'gray';
		case 'TURNED_IN':
			return 'blue';
		case 'RETURNED':
			return 'green';
		case 'RECLAIMED_BY_STUDENT':
			return 'orange';
		default:
			return 'gray';
	}
}

function getStateLabel(state: string | null | undefined) {
	switch (state) {
		case 'NEW':
			return 'Assigned';
		case 'CREATED':
			return 'Not started';
		case 'TURNED_IN':
			return 'Turned in';
		case 'RETURNED':
			return 'Graded';
		case 'RECLAIMED_BY_STUDENT':
			return 'Reclaimed';
		default:
			return state || 'Unknown';
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
		<Card
			withBorder
			padding='md'
			radius='sm'
			style={{ transition: 'all 0.2s' }}
			className='hover-lift'
		>
			<Group justify='space-between' wrap='nowrap'>
				<Group gap='md' style={{ flex: 1, minWidth: 0 }}>
					<Box
						style={{
							width: '2.5rem',
							height: '2.5rem',
							borderRadius: '50%',
							background: 'var(--mantine-color-blue-1)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						}}
					>
						<IconUser
							size='1.25rem'
							style={{ color: 'var(--mantine-color-blue-6)' }}
						/>
					</Box>
					<Box style={{ flex: 1, minWidth: 0 }}>
						<Text size='sm' fw={500} lineClamp={1}>
							{userId}
						</Text>
						<Group gap='xs' mt='0.25rem'>
							<Badge
								size='sm'
								variant='dot'
								color={getStateColor(state)}
								leftSection={<IconPointFilled size='0.5rem' />}
							>
								{getStateLabel(state)}
							</Badge>
							{late && (
								<Badge size='sm' color='red' variant='light'>
									Late
								</Badge>
							)}
						</Group>
					</Box>
				</Group>

				{(assignedGrade !== null && assignedGrade !== undefined) ||
				draftGrade !== null ? (
					<Box style={{ textAlign: 'right', flexShrink: 0 }}>
						<Text size='xl' fw={700} c='blue' mb='0.25rem'>
							{assignedGrade ?? draftGrade}
						</Text>
						<Text size='xs' c='dimmed'>
							/ {maxPoints}
						</Text>
					</Box>
				) : (
					<Box style={{ textAlign: 'right', flexShrink: 0 }}>
						<Text size='sm' c='dimmed'>
							Not graded
						</Text>
					</Box>
				)}
			</Group>
		</Card>
	);
}
