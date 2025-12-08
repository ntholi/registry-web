'use client';

import {
	Accordion,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	NumberInput,
	Paper,
	ScrollArea,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getAssessmentByModuleId } from '@/modules/academic/features/assessments/server/actions';
import {
	ASSESSMENT_TYPES,
	COURSE_WORK_OPTIONS,
} from '@/modules/academic/features/assessments/utils';
import { createQuiz } from '../../server/actions';
import type { Question, QuizFormValues } from '../../types';
import QuestionCard, { createDefaultQuestion } from './QuestionCard';

type QuizFormProps = {
	courseId: number;
	moduleId: number;
};

export default function QuizForm({ courseId, moduleId }: QuizFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [openedQuestion, setOpenedQuestion] = useState<string | null>(null);

	const { data: assessments } = useQuery({
		queryKey: ['module-assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
		enabled: opened,
	});

	const form = useForm<QuizFormValues>({
		initialValues: {
			assessmentNumber: '',
			assessmentType: '',
			weight: 0,
			timelimit: null,
			attempts: 1,
			questions: [],
		},
		validate: {
			assessmentNumber: (v) => (!v ? 'Assessment number is required' : null),
			assessmentType: (v) => (!v ? 'Quiz type is required' : null),
			weight: (v) =>
				v < 1 || v > 100 ? 'Weight must be between 1 and 100' : null,
			questions: (v) =>
				v.length === 0 ? 'At least one question is required' : null,
		},
	});

	const formResetRef = useRef(form.reset);
	const formSetFieldValueRef = useRef(form.setFieldValue);

	useEffect(() => {
		formResetRef.current = form.reset;
		formSetFieldValueRef.current = form.setFieldValue;
	}, [form.reset, form.setFieldValue]);

	useEffect(() => {
		if (!opened) return;

		formResetRef.current();

		if (assessments && assessments.length > 0) {
			const assessmentNumbers = assessments
				.map((a) => {
					const match = a.assessmentNumber.match(/CW(\d+)/);
					return match ? parseInt(match[1], 10) : 0;
				})
				.filter((n) => n > 0);

			if (assessmentNumbers.length > 0) {
				const highestNumber = Math.max(...assessmentNumbers);
				const nextNumber = highestNumber + 1;
				if (nextNumber <= 15) {
					formSetFieldValueRef.current('assessmentNumber', `CW${nextNumber}`);
				}
			} else {
				formSetFieldValueRef.current('assessmentNumber', 'CW1');
			}

			const currentTotalWeight = assessments.reduce(
				(sum, a) => sum + a.weight,
				0
			);

			const remainingWeight = Math.max(0, 100 - currentTotalWeight);
			formSetFieldValueRef.current('weight', remainingWeight);
		} else {
			formSetFieldValueRef.current('assessmentNumber', 'CW1');
			formSetFieldValueRef.current('weight', 100);
		}
	}, [opened, assessments]);

	const totalMarks = form.values.questions.reduce(
		(sum, q) => sum + q.defaultMark,
		0
	);

	const mutation = useMutation({
		mutationFn: async (values: QuizFormValues) => {
			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === values.assessmentType)
					?.label || 'Quiz';

			return createQuiz({
				courseId,
				moduleId,
				name: typeLabel,
				assessmentNumber: values.assessmentNumber,
				weight: values.weight,
				timelimit: values.timelimit,
				attempts: values.attempts,
				questions: values.questions,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Quiz created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['course-quizzes', courseId],
			});
			queryClient.invalidateQueries({
				queryKey: ['module-assessments', moduleId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to create an assessment',
				color: 'red',
			});
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		mutation.mutate(values);
	});

	const addQuestion = () => {
		const newQuestion = createDefaultQuestion(
			'multichoice',
			form.values.questions.length
		);
		form.setFieldValue('questions', [...form.values.questions, newQuestion]);
		setOpenedQuestion(`question-${form.values.questions.length}`);
	};

	const updateQuestion = (index: number, question: Question) => {
		const newQuestions = [...form.values.questions];
		newQuestions[index] = question;
		form.setFieldValue('questions', newQuestions);
	};

	const deleteQuestion = (index: number) => {
		form.setFieldValue(
			'questions',
			form.values.questions.filter((_, i) => i !== index)
		);
	};

	return (
		<>
			<Button
				onClick={open}
				variant='light'
				leftSection={<IconPlus size={16} />}
				size='xs'
			>
				New Quiz
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Create Assessment'
				fullScreen
				styles={{
					content: { display: 'flex', flexDirection: 'column' },
					body: {
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					},
				}}
			>
				<Box
					style={{
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						minHeight: 0,
					}}
				>
					<form
						onSubmit={handleSubmit}
						style={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							minHeight: 0,
						}}
					>
						<div
							style={{
								display: 'flex',
								gap: 'var(--mantine-spacing-lg)',
								flex: 1,
								minHeight: 0,
							}}
						>
							<div
								style={{
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									minHeight: 0,
									overflow: 'hidden',
								}}
							>
								<Group justify='space-between' mb='md'>
									<Text fw={500}>Questions</Text>
									<Button
										variant='light'
										size='xs'
										leftSection={<IconPlus size={14} />}
										onClick={addQuestion}
									>
										Add Question
									</Button>
								</Group>

								<ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars>
									{form.values.questions.length === 0 ? (
										<Paper withBorder p='xl' ta='center'>
											<Stack align='center' gap='sm'>
												<Text c='dimmed' size='sm'>
													No questions added yet
												</Text>
												<Button
													variant='default'
													size='sm'
													leftSection={<IconPlus size={16} />}
													onClick={addQuestion}
												>
													Add Your First Question
												</Button>
											</Stack>
										</Paper>
									) : (
										<Accordion
											value={openedQuestion}
											onChange={setOpenedQuestion}
											variant='separated'
										>
											{form.values.questions.map((question, index) => (
												<QuestionCard
													key={index}
													question={question}
													index={index}
													onUpdate={updateQuestion}
													onDelete={deleteQuestion}
												/>
											))}
										</Accordion>
									)}
								</ScrollArea>
							</div>

							<div style={{ width: 350, minWidth: 350 }}>
								<Paper withBorder p='md'>
									<Stack gap='md'>
										<Text fw={500}>Quiz Settings</Text>

										<Select
											label='Assessment Number'
											placeholder='Select assessment number'
											data={COURSE_WORK_OPTIONS}
											{...form.getInputProps('assessmentNumber')}
										/>

										<Select
											label='Assessment Type'
											placeholder='Select assessment type'
											data={ASSESSMENT_TYPES}
											{...form.getInputProps('assessmentType')}
										/>

										<Divider />

										<Box>
											<Group justify='space-between' mb='xs'>
												<Text size='sm' c='dimmed'>
													Total Marks
												</Text>
												<Badge size='lg' variant='light'>
													{totalMarks}
												</Badge>
											</Group>
											<Text size='xs' c='dimmed'>
												Calculated from question marks
											</Text>
										</Box>

										<NumberInput
											label='Weight (%)'
											placeholder='0'
											min={0}
											max={100}
											{...form.getInputProps('weight')}
										/>

										<Divider />

										<TextInput
											label='Time Limit (minutes)'
											placeholder='No limit'
											type='number'
											min={0}
											{...form.getInputProps('timelimit')}
										/>

										<NumberInput
											label='Allowed Attempts'
											placeholder='1'
											min={0}
											description='0 = unlimited'
											{...form.getInputProps('attempts')}
										/>

										<Divider />

										<Button
											type='submit'
											fullWidth
											loading={mutation.isPending}
											disabled={form.values.questions.length === 0}
										>
											Create Assessment
										</Button>
									</Stack>
								</Paper>
							</div>
						</div>
					</form>
				</Box>
			</Modal>
		</>
	);
}
