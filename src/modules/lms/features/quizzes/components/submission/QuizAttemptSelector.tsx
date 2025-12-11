'use client';

import { Badge, Group, Select } from '@mantine/core';
import type { QuizAttempt } from '../../types';

type Props = {
	attempts: QuizAttempt[];
	selectedAttemptId: number | null;
	onSelectAttempt: (attemptId: number) => void;
	maxGrade: number;
};

function formatDate(timestamp: number | null): string {
	if (!timestamp) return 'N/A';
	return new Date(timestamp * 1000).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getStateColor(
	state: string
): 'green' | 'yellow' | 'red' | 'gray' | 'blue' {
	switch (state) {
		case 'finished':
			return 'green';
		case 'inprogress':
			return 'blue';
		case 'overdue':
			return 'yellow';
		case 'abandoned':
			return 'red';
		default:
			return 'gray';
	}
}

function getStateLabel(state: string): string {
	switch (state) {
		case 'finished':
			return 'Completed';
		case 'inprogress':
			return 'In Progress';
		case 'overdue':
			return 'Overdue';
		case 'abandoned':
			return 'Abandoned';
		default:
			return state;
	}
}

export default function QuizAttemptSelector({
	attempts,
	selectedAttemptId,
	onSelectAttempt,
	maxGrade,
}: Props) {
	if (attempts.length === 0) return null;

	if (attempts.length === 1) {
		const attempt = attempts[0];
		return (
			<Group gap='sm'>
				<Badge size='sm' color={getStateColor(attempt.state)} variant='light'>
					{getStateLabel(attempt.state)}
				</Badge>
			</Group>
		);
	}

	const options = attempts.map((attempt) => ({
		value: attempt.id.toString(),
		label: `Attempt ${attempt.attempt} - ${formatDate(attempt.timefinish)} (${
			attempt.sumgrades !== null
				? `${attempt.sumgrades.toFixed(1)}/${maxGrade}`
				: 'Not graded'
		})`,
	}));

	return (
		<Select
			size='sm'
			data={options}
			value={selectedAttemptId?.toString() || attempts[0].id.toString()}
			onChange={(value) => value && onSelectAttempt(Number(value))}
			w={350}
		/>
	);
}
