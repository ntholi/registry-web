'use client';

import {
	Button,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { IconCalculator, IconRefresh } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recalculateApplicationScores } from '../_server/actions';

type Props = {
	applicationId: string;
	scores: {
		overallScore: number | null;
		firstChoiceScore: number | null;
		secondChoiceScore: number | null;
		calculatedAt: Date | null;
	} | null;
	firstChoiceProgram: { code: string; name: string } | null;
	secondChoiceProgram: { code: string; name: string } | null;
};

function ScoreDisplay({
	label,
	score,
	subtitle,
}: {
	label: string;
	score: number | null;
	subtitle?: string;
}) {
	return (
		<Card withBorder>
			<Stack gap={4}>
				<Text size='sm' fw={500} c='dimmed'>
					{label}
				</Text>
				{subtitle && (
					<Text size='xs' c='dimmed'>
						{subtitle}
					</Text>
				)}
				<Text size='xl' fw={700} c={score != null ? 'blue' : 'dimmed'}>
					{score != null ? `${score.toFixed(2)} / 7.00` : 'Not calculated'}
				</Text>
			</Stack>
		</Card>
	);
}

export default function ScoresSection({
	applicationId,
	scores,
	firstChoiceProgram,
	secondChoiceProgram,
}: Props) {
	const queryClient = useQueryClient();

	const recalculate = useMutation({
		mutationFn: () => recalculateApplicationScores(applicationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
		},
	});

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Group gap='xs'>
					<IconCalculator size={20} />
					<Text fw={500}>Application Scores</Text>
				</Group>
				<Tooltip label='Recalculate scores based on current academic records'>
					<Button
						variant='light'
						size='xs'
						leftSection={<IconRefresh size={14} />}
						loading={recalculate.isPending}
						onClick={() => recalculate.mutate()}
					>
						Recalculate
					</Button>
				</Tooltip>
			</Group>

			<ScoreDisplay
				label='Overall Score'
				score={scores?.overallScore ?? null}
			/>

			<SimpleGrid cols={2}>
				<ScoreDisplay
					label='First Choice Score'
					score={scores?.firstChoiceScore ?? null}
					subtitle={
						firstChoiceProgram
							? `${firstChoiceProgram.code} - ${firstChoiceProgram.name}`
							: undefined
					}
				/>

				{secondChoiceProgram && (
					<ScoreDisplay
						label='Second Choice Score'
						score={scores?.secondChoiceScore ?? null}
						subtitle={`${secondChoiceProgram.code} - ${secondChoiceProgram.name}`}
					/>
				)}
			</SimpleGrid>

			{!scores && (
				<Text size='sm' c='dimmed'>
					Scores have not been calculated yet. Click &quot;Recalculate&quot; to
					compute scores based on the applicant&apos;s academic records.
				</Text>
			)}
		</Stack>
	);
}
