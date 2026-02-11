'use client';

import {
	Accordion,
	Badge,
	Box,
	Button,
	Divider,
	Grid,
	Group,
	Loader,
	Modal,
	NumberInput,
	Paper,
	ScrollArea,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ASSESSMENT_TYPES,
	COURSE_WORK_OPTIONS,
} from '@/app/academic/assessments/_lib/utils';
import { getAssessmentByModuleId } from '@/app/academic/assessments/_server/actions';
import {
	createDraftQuiz,
	publishQuiz,
	saveDraftQuizQuestion,
	updateQuiz,
} from '../../_server/actions';
import type { Question, QuizFormValues } from '../../types';
import QuestionCard, { createDefaultQuestion } from './QuestionCard';

type QuizFormProps = {
	courseId: number;
	moduleId: number;
};

type SaveState = 'idle' | 'saving' | 'saved';

const QUIZ_TYPES = ASSESSMENT_TYPES.filter((t) => /^Quiz \d+$/.test(t.label));

function getNextQuizType(
	used: string[]
): { value: string; label: string } | undefined {
	const usedLabels = new Set(used);
	return QUIZ_TYPES.find((t) => !usedLabels.has(t.label));
}

export default function QuizForm({ courseId, moduleId }: QuizFormProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [openedQuestion, setOpenedQuestion] = useState<string | null>(null);
	const [draftQuizId, setDraftQuizId] = useState<number | null>(null);
	const [saveState, setSaveState] = useState<SaveState>('idle');
	const [savedQuestionCount, setSavedQuestionCount] = useState(0);
	const savingRef = useRef(false);

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
			startDateTime: null,
			endDateTime: null,
			attempts: 1,
			questions: [],
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
		setDraftQuizId(null);
		setSaveState('idle');
		setSavedQuestionCount(0);

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

			const usedTypes = assessments.map((a) => a.assessmentType);
			const nextQuiz = getNextQuizType(usedTypes);
			if (nextQuiz) {
				formSetFieldValueRef.current('assessmentType', nextQuiz.value);
			}
		} else {
			formSetFieldValueRef.current('assessmentNumber', 'CW1');
			const firstQuiz = QUIZ_TYPES[0];
			if (firstQuiz) {
				formSetFieldValueRef.current('assessmentType', firstQuiz.value);
			}
		}

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		formSetFieldValueRef.current('startDateTime', tomorrow);

		const endTime = new Date(tomorrow);
		endTime.setHours(endTime.getHours() + 1);
		formSetFieldValueRef.current('endDateTime', endTime);
	}, [opened, assessments]);

	const totalMarks = form.values.questions.reduce(
		(sum, q) => sum + q.defaultMark,
		0
	);

	const canCreateDraft =
		!!form.values.assessmentNumber && !!form.values.assessmentType;

	const createDraftMutation = useMutation({
		mutationFn: async () => {
			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === form.values.assessmentType)
					?.label || 'Quiz';

			return createDraftQuiz({
				courseId,
				name: typeLabel,
				startDateTime: form.values.startDateTime,
				endDateTime: form.values.endDateTime,
				attempts: form.values.attempts,
			});
		},
		onSuccess: (result) => {
			setDraftQuizId(result.quizId);
			setSaveState('saved');
			queryClient.invalidateQueries({
				queryKey: ['course-quizzes', courseId],
			});
		},
		onError: (error) => {
			setSaveState('idle');
			notifications.show({
				message: error.message || 'Failed to create draft',
				color: 'red',
			});
		},
	});

	const saveSettingsMutation = useMutation({
		mutationFn: async () => {
			if (!draftQuizId) return;
			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === form.values.assessmentType)
					?.label || 'Quiz';

			await updateQuiz(draftQuizId, {
				name: typeLabel,
				timeopen: form.values.startDateTime
					? Math.floor(form.values.startDateTime.getTime() / 1000)
					: undefined,
				timeclose: form.values.endDateTime
					? Math.floor(form.values.endDateTime.getTime() / 1000)
					: undefined,
				attempts: form.values.attempts,
			});
		},
		onSuccess: () => {
			setSaveState('saved');
		},
		onError: () => {
			setSaveState('saved');
		},
	});

	const triggerAutoSave = useCallback(() => {
		if (savingRef.current) return;
		if (!draftQuizId) {
			if (canCreateDraft && !createDraftMutation.isPending) {
				setSaveState('saving');
				savingRef.current = true;
				createDraftMutation.mutate(undefined, {
					onSettled: () => {
						savingRef.current = false;
					},
				});
			}
			return;
		}
		setSaveState('saving');
		savingRef.current = true;
		saveSettingsMutation.mutate(undefined, {
			onSettled: () => {
				savingRef.current = false;
			},
		});
	}, [draftQuizId, canCreateDraft, createDraftMutation, saveSettingsMutation]);

	const debouncedSave = useDebouncedCallback(triggerAutoSave, 1500);

	useEffect(() => {
		if (!opened) return;
		if (!canCreateDraft) return;
		debouncedSave();
	}, [
		form.values.assessmentType,
		form.values.assessmentNumber,
		form.values.startDateTime,
		form.values.endDateTime,
		form.values.attempts,
		opened,
		canCreateDraft,
		debouncedSave,
	]);

	const saveQuestionMutation = useMutation({
		mutationFn: async ({
			question,
			page,
		}: {
			question: Question;
			page: number;
		}) => {
			if (!draftQuizId) throw new Error('No draft quiz');
			return saveDraftQuizQuestion(courseId, draftQuizId, question, page);
		},
		onSuccess: () => {
			setSavedQuestionCount((c) => c + 1);
			setSaveState('saved');
			queryClient.invalidateQueries({
				queryKey: ['course-quizzes', courseId],
			});
		},
		onError: (error) => {
			setSaveState('saved');
			notifications.show({
				message: error.message || 'Failed to save question',
				color: 'red',
			});
		},
	});

	const addQuestion = () => {
		const lastType = form.values.questions.at(-1)?.type ?? 'multichoice';
		const newQuestion = createDefaultQuestion(
			lastType,
			form.values.questions.length
		);
		form.setFieldValue('questions', [...form.values.questions, newQuestion]);
		setOpenedQuestion(`question-${form.values.questions.length}`);
	};

	const updateQuestion = (index: number, question: Question) => {
		const newQuestions = [...form.values.questions];
		newQuestions[index] = question;
		form.setFieldValue('questions', newQuestions);

		if (draftQuizId && index >= savedQuestionCount) {
			const isComplete =
				question.name.trim() !== '' && question.questionText.trim() !== '';
			if (isComplete) {
				setSaveState('saving');
				saveQuestionMutation.mutate({
					question,
					page: index + 1,
				});
			}
		}
	};

	const deleteQuestion = (index: number) => {
		form.setFieldValue(
			'questions',
			form.values.questions.filter((_, i) => i !== index)
		);
	};

	const publishMutation = useMutation({
		mutationFn: async () => {
			if (!draftQuizId) throw new Error('No draft quiz to publish');
			return publishQuiz({
				quizId: draftQuizId,
				courseId,
				moduleId,
				assessmentNumber: form.values.assessmentNumber,
				weight: form.values.weight,
				totalMarks: totalMarks || 100,
			});
		},
		onSuccess: () => {
			notifications.show({ message: 'Quiz published', color: 'green' });
			queryClient.invalidateQueries({ queryKey: ['course-quizzes', courseId] });
			queryClient.invalidateQueries({
				queryKey: ['module-assessments', moduleId],
			});
			form.reset();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to publish quiz',
				color: 'red',
			});
		},
	});

	function handleClose() {
		if (draftQuizId) {
			queryClient.invalidateQueries({
				queryKey: ['course-quizzes', courseId],
			});
			queryClient.invalidateQueries({
				queryKey: ['module-assessments', moduleId],
			});
		}
		close();
	}

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
				onClose={handleClose}
				title={
					<Group gap='sm'>
						<Text fw={600}>Create Test/Quiz Assessment</Text>
						<DraftSaveBadge state={saveState} />
					</Group>
				}
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
					<div
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
										disabled={!draftQuizId}
									>
										Add Question
									</Button>
								</Group>

								<ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars>
									{form.values.questions.length === 0 ? (
										<Paper withBorder p='xl' ta='center'>
											<Stack align='center' gap='sm'>
												<Text c='dimmed' size='sm'>
													{!draftQuizId
														? 'Fill in the assessment details to start adding questions'
														: 'No questions added yet'}
												</Text>
												{draftQuizId && (
													<Button
														variant='default'
														size='sm'
														leftSection={<IconPlus size={16} />}
														onClick={addQuestion}
													>
														Add Your First Question
													</Button>
												)}
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
													key={question.name}
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
										<Box>
											<Group justify='space-between'>
												<Text size='sm' fw={500}>
													Total Marks
												</Text>
												<Badge radius={'sm'} color='green' variant='light'>
													{totalMarks} Marks
												</Badge>
											</Group>
										</Box>

										<Select
											label='Assessment Number'
											placeholder='Select assessment number'
											searchable
											data={COURSE_WORK_OPTIONS}
											{...form.getInputProps('assessmentNumber')}
										/>

										<Select
											label='Assessment Type'
											placeholder='Select assessment type'
											searchable
											data={ASSESSMENT_TYPES}
											{...form.getInputProps('assessmentType')}
										/>

										<NumberInput
											label='Weight (%)'
											placeholder='0'
											min={0}
											max={100}
											{...form.getInputProps('weight')}
										/>

										<DateTimePicker
											label='Start Date/Time'
											placeholder='Select start date and time'
											clearable
											{...form.getInputProps('startDateTime')}
										/>

										<DateTimePicker
											label='End Date/Time'
											placeholder='Select end date and time'
											clearable
											minDate={form.values.startDateTime || undefined}
											{...form.getInputProps('endDateTime')}
										/>

										<Select
											label='Allowed Attempts'
											description='Number of times a student can attempt this quiz'
											data={[
												{ value: '0', label: 'Unlimited' },
												{ value: '1', label: '1' },
												{ value: '2', label: '2' },
												{ value: '3', label: '3' },
												{ value: '4', label: '4' },
												{ value: '5', label: '5' },
												{ value: '6', label: '6' },
												{ value: '7', label: '7' },
												{ value: '8', label: '8' },
												{ value: '9', label: '9' },
												{ value: '10', label: '10' },
											]}
											value={String(form.values.attempts)}
											onChange={(value) =>
												form.setFieldValue('attempts', Number(value))
											}
										/>

										<Divider />

										<Grid>
											<Grid.Col span={5}>
												<Button
													fullWidth
													variant='default'
													onClick={handleClose}
												>
													Save
												</Button>
											</Grid.Col>
											<Grid.Col span={7}>
												<Button
													fullWidth
													onClick={() => publishMutation.mutate()}
													loading={publishMutation.isPending}
													disabled={!draftQuizId}
												>
													Publish
												</Button>
											</Grid.Col>
										</Grid>
									</Stack>
								</Paper>
							</div>
						</div>
					</div>
				</Box>
			</Modal>
		</>
	);
}

type DraftSaveBadgeProps = {
	state: SaveState;
};

function DraftSaveBadge({ state }: DraftSaveBadgeProps) {
	if (state === 'idle') return null;

	if (state === 'saving') {
		return (
			<Badge
				variant='light'
				color='blue'
				size='sm'
				leftSection={<Loader size={10} color='blue' />}
			>
				Saving...
			</Badge>
		);
	}

	return (
		<Badge
			variant='light'
			color='green'
			size='sm'
			leftSection={<IconCheck size={12} />}
		>
			Saved as Draft
		</Badge>
	);
}
