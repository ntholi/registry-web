'use client';

import {
	Accordion,
	ActionIcon,
	Box,
	Button,
	Group,
	NumberInput,
	Paper,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useImperativeHandle, useState } from 'react';
import type { Rubric } from '../../../types';
import { createRubric, updateRubric } from '../server/actions';

type Props = {
	cmid: number;
	maxGrade: number;
	assignmentName: string;
	existingRubric: Rubric | null;
	onSuccess: () => void;
	formRef?: React.RefObject<{ submit: () => void } | null>;
};

type FormCriterion = {
	id?: number;
	description: string;
	sortorder?: number;
	levels: Array<{
		id?: number;
		score: number;
		definition: string;
	}>;
};

type FormValues = {
	name: string;
	description: string;
	criteria: FormCriterion[];
};

export default function RubricForm({
	cmid,
	maxGrade,
	assignmentName,
	existingRubric,
	onSuccess,
	formRef,
}: Props) {
	const queryClient = useQueryClient();
	const [openItems, setOpenItems] = useState<string[]>(['criterion-0']);

	const maxScorePerCriterion = Math.floor(maxGrade / 4);
	const levelScores = [
		0,
		Math.floor(maxScorePerCriterion / 3),
		Math.floor((maxScorePerCriterion * 2) / 3),
		maxScorePerCriterion,
	];

	const rubricName = existingRubric?.name ?? `${assignmentName} Rubric`;

	const form = useForm<FormValues>({
		initialValues: {
			name: rubricName,
			description: existingRubric?.description ?? '',
			criteria: existingRubric?.criteria ?? [
				{
					description: '',
					levels: [
						{ score: levelScores[0], definition: 'Poor' },
						{ score: levelScores[1], definition: 'Fair' },
						{ score: levelScores[2], definition: 'Good' },
						{ score: levelScores[3], definition: 'Excellent' },
					],
				},
			],
		},
		validate: {
			criteria: {
				description: (value) =>
					!value.trim() ? 'Criterion description is required' : null,
				levels: {
					definition: (value) =>
						!value.trim() ? 'Level definition is required' : null,
					score: (_value, values, path) => {
						const criteriaPath = path.split('.')[1];
						const criterionIndex = Number.parseInt(criteriaPath, 10);
						const criterion = values.criteria[criterionIndex];
						const maxCriterionScore = Math.max(
							...criterion.levels.map((l) => l.score || 0)
						);
						const otherCriteriaTotal = values.criteria.reduce((sum, c, idx) => {
							if (idx === criterionIndex) return sum;
							return sum + Math.max(...c.levels.map((l) => l.score || 0));
						}, 0);
						const totalScore = otherCriteriaTotal + maxCriterionScore;
						if (totalScore > maxGrade) {
							return `Total criteria score (${totalScore}) exceeds maximum grade (${maxGrade})`;
						}
						return null;
					},
				},
			},
		},
	});

	const saveMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const criteriaWithSortOrder = values.criteria.map((c, idx) => ({
				...c,
				sortorder: c.sortorder ?? idx,
			}));

			if (existingRubric) {
				return updateRubric(cmid, {
					name: values.name,
					description: values.description,
					criteria: criteriaWithSortOrder,
				});
			}
			return createRubric({
				cmid,
				name: values.name,
				description: values.description,
				criteria: criteriaWithSortOrder,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rubric', cmid] });
			onSuccess();
		},
	});

	useImperativeHandle(formRef, () => ({
		submit: () => form.onSubmit((values) => saveMutation.mutate(values))(),
	}));

	function addCriterion() {
		const newIndex = form.values.criteria.length;
		form.insertListItem('criteria', {
			description: '',
			levels: [
				{ score: levelScores[0], definition: 'Poor' },
				{ score: levelScores[1], definition: 'Fair' },
				{ score: levelScores[2], definition: 'Good' },
				{ score: levelScores[3], definition: 'Excellent' },
			],
		});
		setOpenItems((prev) => [...prev, `criterion-${newIndex}`]);
	}

	function removeCriterion(index: number) {
		form.removeListItem('criteria', index);
		setOpenItems((prev) =>
			prev.filter((item) => item !== `criterion-${index}`)
		);
	}

	function addLevel(criterionIndex: number) {
		const levels = form.values.criteria[criterionIndex].levels;
		const maxScore = Math.max(...levels.map((l) => l.score), 0);
		form.insertListItem(`criteria.${criterionIndex}.levels`, {
			score: maxScore + 1,
			definition: '',
		});
	}

	function removeLevel(criterionIndex: number, levelIndex: number) {
		form.removeListItem(`criteria.${criterionIndex}.levels`, levelIndex);
	}

	const totalScore = form.values.criteria.reduce((sum, criterion) => {
		const maxCriterionScore = Math.max(
			...criterion.levels.map((l) => l.score || 0)
		);
		return sum + maxCriterionScore;
	}, 0);

	const isOverLimit = totalScore > maxGrade;

	return (
		<form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
			<Stack gap='md'>
				<Paper p='sm' withBorder bg={isOverLimit ? 'red.0' : undefined}>
					<Group justify='space-between'>
						<Text size='sm' fw={500}>
							Total Criteria Score
						</Text>
						<Text
							size='sm'
							fw={700}
							c={
								isOverLimit
									? 'red'
									: totalScore === maxGrade
										? 'green'
										: undefined
							}
						>
							{totalScore} / {maxGrade}
						</Text>
					</Group>
					{isOverLimit && (
						<Text size='xs' c='red' mt='xs'>
							Total score exceeds the maximum grade. Please adjust the criteria
							levels.
						</Text>
					)}
				</Paper>

				<Accordion
					multiple
					value={openItems}
					onChange={setOpenItems}
					variant='separated'
				>
					{form.values.criteria.map((criterion, criterionIndex) => (
						<Accordion.Item
							key={criterion.id ?? criterionIndex}
							value={`criterion-${criterionIndex}`}
							pos='relative'
						>
							<Accordion.Control>
								<Stack gap={2}>
									<Text size='sm' fw={500}>
										Criterion {criterionIndex + 1}
									</Text>
									{criterion.description && (
										<Text size='xs' c='dimmed' lineClamp={1}>
											{criterion.description}
										</Text>
									)}
								</Stack>
							</Accordion.Control>
							{form.values.criteria.length > 1 && (
								<ActionIcon
									variant='subtle'
									color='red'
									pos='absolute'
									top={8}
									right={48}
									style={{ zIndex: 1 }}
									onClick={() => removeCriterion(criterionIndex)}
								>
									<IconTrash size={16} />
								</ActionIcon>
							)}
							<Accordion.Panel>
								<Stack gap='md'>
									<Textarea
										placeholder='Enter criterion description'
										autosize
										minRows={1}
										{...form.getInputProps(
											`criteria.${criterionIndex}.description`
										)}
									/>

									<Text size='xs' c='dimmed'>
										Levels
									</Text>

									{criterion.levels.map((level, levelIndex) => (
										<Group
											key={level.id ?? `level-${criterionIndex}-${levelIndex}`}
											align='flex-start'
											gap='sm'
										>
											<NumberInput
												w={80}
												size='xs'
												placeholder='Score'
												min={0}
												{...form.getInputProps(
													`criteria.${criterionIndex}.levels.${levelIndex}.score`
												)}
											/>
											<Box style={{ flex: 1 }}>
												<TextInput
													size='xs'
													placeholder='Level definition'
													{...form.getInputProps(
														`criteria.${criterionIndex}.levels.${levelIndex}.definition`
													)}
												/>
											</Box>
											{criterion.levels.length > 1 && (
												<ActionIcon
													variant='subtle'
													color='red'
													size='sm'
													onClick={() =>
														removeLevel(criterionIndex, levelIndex)
													}
												>
													<IconTrash size={14} />
												</ActionIcon>
											)}
										</Group>
									))}

									<Button
										variant='subtle'
										size='xs'
										leftSection={<IconPlus size={14} />}
										onClick={() => addLevel(criterionIndex)}
									>
										Add Level
									</Button>
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>

				<Button
					variant='light'
					leftSection={<IconPlus size={16} />}
					onClick={addCriterion}
				>
					Add Criterion
				</Button>
			</Stack>
		</form>
	);
}
