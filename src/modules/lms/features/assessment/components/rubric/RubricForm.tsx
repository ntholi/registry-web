'use client';

import {
	ActionIcon,
	Box,
	Button,
	Divider,
	Group,
	NumberInput,
	Paper,
	Stack,
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconRuler2, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRubric, updateRubric } from '../../server/actions';
import type { Rubric, RubricCriterion } from '../../types';

type Props = {
	cmid: number;
	maxGrade: number;
	existingRubric: Rubric | null;
	onCancel: () => void;
	onSuccess: () => void;
};

type FormValues = {
	name: string;
	description: string;
	criteria: RubricCriterion[];
};

export default function RubricForm({
	cmid,
	maxGrade,
	existingRubric,
	onCancel,
	onSuccess,
}: Props) {
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		initialValues: {
			name: existingRubric?.name ?? 'Assessment Rubric',
			description: existingRubric?.description ?? '',
			criteria: existingRubric?.criteria ?? [
				{
					description: '',
					levels: [
						{ score: 0, definition: 'Does not meet requirements' },
						{
							score: Math.floor(maxGrade / 2),
							definition: 'Meets some requirements',
						},
						{ score: maxGrade, definition: 'Meets all requirements' },
					],
				},
			],
		},
		validate: {
			name: (value) => (!value.trim() ? 'Name is required' : null),
			criteria: {
				description: (value) =>
					!value.trim() ? 'Criterion description is required' : null,
				levels: {
					definition: (value) =>
						!value.trim() ? 'Level definition is required' : null,
				},
			},
		},
	});

	const saveMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (existingRubric) {
				return updateRubric(cmid, {
					name: values.name,
					description: values.description,
					criteria: values.criteria,
				});
			}
			return createRubric({
				cmid,
				name: values.name,
				description: values.description,
				criteria: values.criteria,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rubric', cmid] });
			onSuccess();
		},
	});

	function addCriterion() {
		form.insertListItem('criteria', {
			description: '',
			levels: [
				{ score: 0, definition: 'Does not meet requirements' },
				{
					score: Math.floor(maxGrade / 2),
					definition: 'Meets some requirements',
				},
				{ score: maxGrade, definition: 'Meets all requirements' },
			],
		});
	}

	function removeCriterion(index: number) {
		form.removeListItem('criteria', index);
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

	return (
		<Paper p='lg' withBorder>
			<form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-start'>
						<Group gap='xs'>
							<ThemeIcon size='sm' variant='light' color='gray'>
								<IconRuler2 size={14} />
							</ThemeIcon>
							<Title order={5}>
								{existingRubric ? 'Edit Rubric' : 'Create Rubric'}
							</Title>
						</Group>
						<Group gap='xs'>
							<Button variant='subtle' color='gray' onClick={onCancel}>
								Cancel
							</Button>
							<Button type='submit' loading={saveMutation.isPending}>
								Save Rubric
							</Button>
						</Group>
					</Group>

					<Divider />

					<TextInput
						label='Rubric Name'
						placeholder='Enter rubric name'
						{...form.getInputProps('name')}
					/>

					<Textarea
						label='Description'
						placeholder='Enter rubric description (optional)'
						autosize
						minRows={2}
						{...form.getInputProps('description')}
					/>

					<Divider label='Criteria' labelPosition='left' />

					{form.values.criteria.map((criterion, criterionIndex) => (
						<Paper key={criterion.id ?? criterionIndex} p='md' withBorder>
							<Stack gap='md'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Criterion {criterionIndex + 1}
									</Text>
									{form.values.criteria.length > 1 && (
										<ActionIcon
											variant='subtle'
											color='red'
											onClick={() => removeCriterion(criterionIndex)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									)}
								</Group>

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
												onClick={() => removeLevel(criterionIndex, levelIndex)}
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
						</Paper>
					))}

					<Button
						variant='light'
						leftSection={<IconPlus size={16} />}
						onClick={addCriterion}
					>
						Add Criterion
					</Button>
				</Stack>
			</form>
		</Paper>
	);
}
