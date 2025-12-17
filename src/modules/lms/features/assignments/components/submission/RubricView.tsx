'use client';

import { Box, Card, Slider, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
	getRubric,
	getRubricFillings,
	saveAssignmentGrade,
} from '../../server/actions';

type Props = {
	cmid: number;
	assignmentId: number;
	userId: number;
	onGradeChange?: (grade: number) => void;
};

export default function RubricView({
	cmid,
	assignmentId,
	userId,
	onGradeChange,
}: Props) {
	const [selectedLevels, setSelectedLevels] = useState<Record<number, number>>(
		{}
	);
	const queryClient = useQueryClient();

	const { data: rubric, isLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid),
	});

	const { data: rubricFillings } = useQuery({
		queryKey: ['rubric-fillings', cmid, userId],
		queryFn: () => getRubricFillings(cmid, userId),
		enabled: !!rubric?.success,
	});

	useEffect(() => {
		if (
			rubricFillings?.success &&
			rubricFillings.fillings &&
			rubric?.criteria
		) {
			const fillingsMap: Record<number, number> = {};
			for (const filling of rubricFillings.fillings) {
				fillingsMap[filling.criterionid] = filling.level.score;
			}
			setSelectedLevels(fillingsMap);
			if (onGradeChange && rubricFillings.grade) {
				onGradeChange(rubricFillings.grade);
			}
		}
	}, [rubricFillings, rubric, onGradeChange]);

	const gradeMutation = useMutation({
		mutationFn: async (newGrade: number) => {
			await saveAssignmentGrade(assignmentId, userId, newGrade);
			return newGrade;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['assignment-grades', assignmentId],
			});
		},
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

	const handleLevelChange = (criterionId: number, value: number) => {
		const updated = {
			...selectedLevels,
			[criterionId]: value,
		};
		setSelectedLevels(updated);
		const newTotal = Object.values(updated).reduce(
			(sum, score) => sum + score,
			0
		);
		if (onGradeChange) {
			onGradeChange(newTotal);
		}
	};

	const handleLevelChangeEnd = (criterionId: number, value: number) => {
		const updated = {
			...selectedLevels,
			[criterionId]: value,
		};
		const newTotal = Object.values(updated).reduce(
			(sum, score) => sum + score,
			0
		);
		gradeMutation.mutate(newTotal);
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
									handleLevelChange(criterion.id || 0, value)
								}
								onChangeEnd={(value) =>
									handleLevelChangeEnd(criterion.id || 0, value)
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
