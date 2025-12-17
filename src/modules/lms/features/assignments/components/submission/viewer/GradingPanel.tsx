'use client';

import {
	Box,
	Card,
	Divider,
	Slider,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { IconListCheck, IconMessageCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
	getAssignmentGrades,
	getRubric,
	getRubricFillings,
	saveAssignmentGrade,
} from '../../../server/actions';
import CommentsView from '../CommentsView';
import GradeInput from '../GradeInput';

type Props = {
	assignmentId: number;
	userId: number;
	maxGrade: number;
	cmid?: number;
};

export default function GradingPanel({
	assignmentId,
	userId,
	maxGrade,
	cmid,
}: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('rubric');
	const [selectedLevels, setSelectedLevels] = useState<Record<number, number>>(
		{}
	);
	const [rubricGrade, setRubricGrade] = useState<number | undefined>();
	const queryClient = useQueryClient();

	const { data: grades } = useQuery({
		queryKey: ['assignment-grades', assignmentId],
		queryFn: () => getAssignmentGrades(assignmentId),
		staleTime: 0,
		refetchOnMount: 'always',
	});

	const { data: rubric, isLoading: rubricLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid!),
		enabled: !!cmid,
	});

	const { data: rubricFillings } = useQuery({
		queryKey: ['rubric-fillings', cmid, userId],
		queryFn: () => getRubricFillings(cmid!, userId),
		enabled: !!rubric?.success && !!cmid,
	});

	useEffect(() => {
		if (
			rubricFillings?.success &&
			rubricFillings.fillings &&
			rubric?.criteria
		) {
			const fillingsMap: Record<number, number> = {};
			for (const filling of rubricFillings.fillings) {
				if (filling.customscore !== undefined && filling.customscore !== null) {
					fillingsMap[filling.criterionid] = filling.customscore;
				} else if (filling.level) {
					fillingsMap[filling.criterionid] = filling.level.score;
				}
			}
			setSelectedLevels(fillingsMap);
			if (rubricFillings.grade) {
				setRubricGrade(rubricFillings.grade);
			}
		}
	}, [rubricFillings, rubric]);

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

	const existingGrade = rubricGrade ?? grades?.get(userId);

	function handleLevelChange(criterionId: number, value: number) {
		setSelectedLevels((prev) => {
			const updated = {
				...prev,
				[criterionId]: value,
			};
			const newTotal = Object.values(updated).reduce(
				(sum, score) => sum + score,
				0
			);
			setRubricGrade(newTotal);
			return updated;
		});
	}

	function handleLevelChangeEnd(criterionId: number, value: number) {
		const updated = {
			...selectedLevels,
			[criterionId]: value,
		};
		const newTotal = Object.values(updated).reduce(
			(sum, score) => sum + score,
			0
		);
		gradeMutation.mutate(newTotal);
	}

	return (
		<Stack gap='md' h='100%'>
			<Box>
				<Text size='xs' fw={600} tt='uppercase' mb='xs'>
					Grade
				</Text>
				<GradeInput
					assignmentId={assignmentId}
					userId={userId}
					maxGrade={maxGrade}
					existingGrade={existingGrade}
				/>
			</Box>

			<Divider />

			<Tabs
				value={activeTab}
				onChange={setActiveTab}
				variant='outline'
				style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
			>
				<TabsList>
					<TabsTab value='rubric' leftSection={<IconListCheck size={14} />}>
						Rubric
					</TabsTab>
					<TabsTab
						value='comments'
						leftSection={<IconMessageCircle size={14} />}
					>
						Comments
					</TabsTab>
				</TabsList>

				<TabsPanel value='rubric' pt='md' style={{ flex: 1, overflow: 'auto' }}>
					{rubricLoading ? (
						<Text c='dimmed' size='sm'>
							Loading rubric...
						</Text>
					) : !rubric?.success ? (
						<Text c='dimmed' size='sm'>
							No rubric has been set for this assignment.
						</Text>
					) : (
						<Stack gap='md'>
							{rubric.criteria.map((criterion) => {
								const sortedLevels = [...criterion.levels].sort(
									(a, b) => a.score - b.score
								);
								const minScore = sortedLevels[0]?.score || 0;
								const maxScore =
									sortedLevels[sortedLevels.length - 1]?.score || 0;

								const marks = sortedLevels.map((level) => ({
									value: level.score,
									label: level.score.toString(),
								}));

								const currentValue =
									selectedLevels[criterion.id || 0] || minScore || 0;
								const currentLevel =
									sortedLevels
										.slice()
										.reverse()
										.find((l) => l.score <= currentValue) || sortedLevels[0];

								return (
									<Card key={criterion.id} withBorder p='sm'>
										<Text fw={600} size='sm'>
											{criterion.description}
										</Text>
										{currentLevel && (
											<Text size='xs' c='dimmed'>
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
												restrictToMarks
												marks={marks}
												size='sm'
												styles={{
													markLabel: { marginTop: 8, fontSize: '10px' },
												}}
											/>
										</Box>
									</Card>
								);
							})}
						</Stack>
					)}
				</TabsPanel>

				<TabsPanel
					value='comments'
					pt='md'
					style={{ flex: 1, overflow: 'auto' }}
				>
					<CommentsView assignmentId={assignmentId} userId={userId} />
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}
