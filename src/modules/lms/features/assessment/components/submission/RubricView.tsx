'use client';

import { Box, Card, Slider, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getRubric } from '../../server/actions';

type Props = {
	cmid: number;
	assignmentId: number;
	userId: number;
	onGradeChange?: (grade: number) => void;
};

export default function RubricView({
	cmid,
	assignmentId: _assignmentId,
	userId: _userId,
	onGradeChange,
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
		setSelectedLevels((prev) => {
			const updated = {
				...prev,
				[criterionId]: value,
			};
			const newTotal = Object.values(updated).reduce(
				(sum, score) => sum + score,
				0
			);
			if (onGradeChange) {
				onGradeChange(newTotal);
			}
			return updated;
		});
	};

	return (
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

				const currentValue = selectedLevels[criterion.id || 0] || minScore || 0;
				const currentLevel =
					sortedLevels
						.slice()
						.reverse()
						.find((l) => l.score <= currentValue) || sortedLevels[0];

				return (
					<Card key={criterion.id} withBorder p='md'>
						<Text fw={600}>{criterion.description}</Text>
						{currentLevel && (
							<Text size='sm' c='dimmed'>
								{currentLevel.definition}
							</Text>
						)}
						<Box mt='md' mb='lg'>
							<Slider
								value={currentValue}
								onChange={(value) =>
									handleLevelSelect(criterion.id || 0, value)
								}
								min={minScore}
								max={maxScore}
								marks={marks}
								size='md'
								styles={{
									markLabel: { marginTop: 8 },
								}}
							/>
						</Box>
					</Card>
				);
			})}
		</Stack>
	);
}
