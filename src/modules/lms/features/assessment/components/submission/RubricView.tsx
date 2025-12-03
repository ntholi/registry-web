'use client';

import { Box, Button, Card, Group, Slider, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getRubric } from '../../server/actions';

type Props = {
	cmid: number;
	assignmentId: number;
	userId: number;
};

export default function RubricView({
	cmid,
	assignmentId: _assignmentId,
	userId: _userId,
}: Props) {
	const [selectedLevels, setSelectedLevels] = useState<Record<number, number>>(
		{}
	);

	const { data: rubric, isLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid),
	});

	if (isLoading) {
		return (
			<Box p='md'>
				<Text c='dimmed' size='sm'>
					Loading rubric...
				</Text>
			</Box>
		);
	}

	if (!rubric || !rubric.success) {
		return (
			<Box p='md'>
				<Text c='dimmed' size='sm'>
					No rubric has been set for this assignment.
				</Text>
			</Box>
		);
	}

	const handleLevelSelect = (criterionId: number, value: number) => {
		setSelectedLevels((prev) => ({
			...prev,
			[criterionId]: value,
		}));
	};

	const totalScore = Object.values(selectedLevels).reduce(
		(sum, score) => sum + score,
		0
	);

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Box>
					<Text fw={600} size='lg'>
						{rubric.name}
					</Text>
					{rubric.description && (
						<Text size='sm' c='dimmed'>
							{rubric.description}
						</Text>
					)}
				</Box>
				<Box>
					<Text size='sm' c='dimmed'>
						Score
					</Text>
					<Text fw={700} size='xl'>
						{totalScore} / {rubric.maxscore}
					</Text>
				</Box>
			</Group>

			<Stack gap='lg'>
				{rubric.criteria.map((criterion) => {
					const sortedLevels = [...criterion.levels].sort(
						(a, b) => a.score - b.score
					);
					const minScore = sortedLevels[0]?.score || 0;
					const maxScore = sortedLevels[sortedLevels.length - 1]?.score || 0;

					const marks = sortedLevels.map((level) => ({
						value: level.score,
						label: level.score.toString(),
					}));

					const currentValue =
						selectedLevels[criterion.id || 0] || minScore || 0;
					const currentLevel = sortedLevels.find(
						(l) => l.score === currentValue
					);

					return (
						<Card key={criterion.id} withBorder p='md'>
							<Text fw={600} mb='xs'>
								{criterion.description}
							</Text>
							{currentLevel && (
								<Text size='sm' c='dimmed' mb='md'>
									{currentLevel.definition}
								</Text>
							)}
							<Box mt='md' mb='xl'>
								<Slider
									value={currentValue}
									onChange={(value) =>
										handleLevelSelect(criterion.id || 0, value)
									}
									min={minScore}
									max={maxScore}
									marks={marks}
									restrictToMarks
									size='md'
									label={(value) => {
										const level = sortedLevels.find((l) => l.score === value);
										return level ? `${level.score}` : value.toString();
									}}
									styles={{
										markLabel: { marginTop: 8 },
									}}
								/>
							</Box>
						</Card>
					);
				})}
			</Stack>

			<Group justify='flex-end'>
				<Button>Save Rubric Marking</Button>
			</Group>
		</Stack>
	);
}
