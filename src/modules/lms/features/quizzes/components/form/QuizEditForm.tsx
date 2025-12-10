'use client';

import {
	Accordion,
	Badge,
	Box,
	Button,
	Divider,
	Grid,
	Group,
	NumberInput,
	Paper,
	ScrollArea,
	Select,
	Stack,
	Switch,
	Tabs,
	Text,
	Textarea,
	TextInput,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconCheck,
	IconFileText,
	IconPlus,
	IconStar,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { removeQuestionFromQuiz, updateQuiz } from '../../server/actions';
import type { MoodleQuiz, MoodleQuizQuestion, Question } from '../../types';
import QuestionCard, { createDefaultQuestion } from './QuestionCard';

type QuizEditFormProps = {
	quiz: MoodleQuiz;
	courseId: number;
};

type EditFormValues = {
	name: string;
	intro: string;
	timeopen: Date | null;
	timeclose: Date | null;
	timelimit: number | null;
	attempts: number;
	grade: number;
	visible: boolean;
	shuffleAnswers: boolean;
	gradeMethod: string;
	navMethod: string;
	questions: Question[];
};

const GRADE_METHOD_OPTIONS = [
	{ value: '1', label: 'Highest grade' },
	{ value: '2', label: 'Average grade' },
	{ value: '3', label: 'First attempt' },
	{ value: '4', label: 'Last attempt' },
];

const NAV_METHOD_OPTIONS = [
	{ value: 'free', label: 'Free navigation' },
	{ value: 'sequential', label: 'Sequential' },
];

function convertMoodleQuestionToLocal(q: MoodleQuizQuestion): Question | null {
	const baseQuestion = {
		name: q.questionname || `Question ${q.slot}`,
		questionText: q.questiontext || '',
		defaultMark: q.defaultmark || q.maxmark || 1,
	};

	switch (q.qtype) {
		case 'multichoice':
			return {
				...baseQuestion,
				type: 'multichoice',
				single: true,
				shuffleAnswers: true,
				answerNumbering: 'abc',
				answers:
					q.answers?.map((a) => ({
						text: a.answer,
						fraction: a.fraction,
						feedback: a.feedback || '',
					})) || [],
			};
		case 'truefalse':
			return {
				...baseQuestion,
				type: 'truefalse',
				correctAnswer: q.correctanswer === 1,
			};
		case 'shortanswer':
			return {
				...baseQuestion,
				type: 'shortanswer',
				useCase: false,
				answers:
					q.answers?.map((a) => ({
						text: a.answer,
						fraction: a.fraction,
						feedback: a.feedback || '',
					})) || [],
			};
		case 'essay':
			return {
				...baseQuestion,
				type: 'essay',
				responseFormat: 'editor',
				responseRequired: true,
				responseFieldLines: 15,
				attachments: 0,
			};
		case 'numerical':
			return {
				...baseQuestion,
				type: 'numerical',
				answers:
					q.answers?.map((a) => ({
						answer: a.answer,
						tolerance: 0,
						fraction: a.fraction,
						feedback: a.feedback || '',
					})) || [],
			};
		default:
			return null;
	}
}

export default function QuizEditForm({ quiz, courseId }: QuizEditFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'general',
	});
	const [openedQuestion, setOpenedQuestion] = useState<string | null>(null);
	const [pendingNewQuestions, setPendingNewQuestions] = useState<Question[]>(
		[]
	);
	const [questionsToRemove, setQuestionsToRemove] = useState<number[]>([]);

	const existingQuestions: Question[] = (quiz.questions || [])
		.map(convertMoodleQuestionToLocal)
		.filter((q): q is Question => q !== null);

	const form = useForm<EditFormValues>({
		initialValues: {
			name: quiz.name || '',
			intro: quiz.intro || '',
			timeopen: quiz.timeopen ? new Date(quiz.timeopen * 1000) : null,
			timeclose: quiz.timeclose ? new Date(quiz.timeclose * 1000) : null,
			timelimit: quiz.timelimit ? Math.floor(quiz.timelimit / 60) : null,
			attempts: quiz.attempts || 0,
			grade: quiz.grade || 0,
			visible: true,
			shuffleAnswers: true,
			gradeMethod: String(quiz.grademethod || 1),
			navMethod: 'free',
			questions: existingQuestions,
		},
		validate: {
			name: (v) => (!v?.trim() ? 'Quiz name is required' : null),
			grade: (v) => (v < 0 ? 'Grade must be positive' : null),
			timelimit: (v) =>
				v !== null && v < 0 ? 'Time limit must be positive' : null,
		},
	});

	const allQuestions = [...form.values.questions, ...pendingNewQuestions];
	const totalMarks = allQuestions.reduce((sum, q) => sum + q.defaultMark, 0);
	const hasChanges =
		form.isDirty() ||
		pendingNewQuestions.length > 0 ||
		questionsToRemove.length > 0;

	const updateMutation = useMutation({
		mutationFn: async (values: EditFormValues) => {
			await updateQuiz(quiz.id, {
				name: values.name,
				intro: values.intro,
				timeopen: values.timeopen
					? Math.floor(values.timeopen.getTime() / 1000)
					: undefined,
				timeclose: values.timeclose
					? Math.floor(values.timeclose.getTime() / 1000)
					: undefined,
				timelimit:
					values.timelimit && values.timelimit > 0
						? values.timelimit * 60
						: undefined,
				attempts: values.attempts,
				grade: values.grade || totalMarks,
				visible: values.visible,
			});

			for (const slot of questionsToRemove) {
				await removeQuestionFromQuiz(quiz.id, slot);
			}

			return { success: true };
		},
		onSuccess: () => {
			notifications.show({
				message: 'Quiz updated successfully',
				color: 'green',
				icon: <IconCheck size={16} />,
			});
			queryClient.invalidateQueries({ queryKey: ['quiz', quiz.id] });
			queryClient.invalidateQueries({ queryKey: ['course-quizzes', courseId] });
			router.push(`/lms/courses/${courseId}/quizzes/${quiz.id}`);
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to update quiz',
				color: 'red',
			});
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		updateMutation.mutate(values);
	});

	const addQuestion = () => {
		const newQuestion = createDefaultQuestion(
			'multichoice',
			allQuestions.length
		);
		setPendingNewQuestions([...pendingNewQuestions, newQuestion]);
		setOpenedQuestion(`new-question-${pendingNewQuestions.length}`);
	};

	const updateExistingQuestion = (index: number, question: Question) => {
		const newQuestions = [...form.values.questions];
		newQuestions[index] = question;
		form.setFieldValue('questions', newQuestions);
	};

	const updateNewQuestion = (index: number, question: Question) => {
		const newQuestions = [...pendingNewQuestions];
		newQuestions[index] = question;
		setPendingNewQuestions(newQuestions);
	};

	const deleteExistingQuestion = (index: number) => {
		const question = quiz.questions?.[index];
		if (question) {
			setQuestionsToRemove([...questionsToRemove, question.slot]);
		}
		form.setFieldValue(
			'questions',
			form.values.questions.filter((_, i) => i !== index)
		);
	};

	const deleteNewQuestion = (index: number) => {
		setPendingNewQuestions(pendingNewQuestions.filter((_, i) => i !== index));
	};

	return (
		<form onSubmit={handleSubmit}>
			<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
				<Tabs.List>
					<Tabs.Tab value='general' leftSection={<IconFileText size={16} />}>
						General
					</Tabs.Tab>
					<Tabs.Tab
						value='questions'
						leftSection={<IconAlertCircle size={16} />}
					>
						Questions
					</Tabs.Tab>
					<Tabs.Tab value='settings'>Settings</Tabs.Tab>

					<Box ml='auto' mt={-5}>
						<Group gap='xs'>
							<Button
								variant='default'
								size='xs'
								onClick={() =>
									router.push(`/lms/courses/${courseId}/quizzes/${quiz.id}`)
								}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								size='xs'
								loading={updateMutation.isPending}
								disabled={!hasChanges}
							>
								Save Changes
							</Button>
						</Group>
					</Box>
				</Tabs.List>

				<Tabs.Panel value='general' pt='lg'>
					<Grid gutter='lg'>
						<Grid.Col span={{ base: 12, md: 8 }}>
							<Stack gap='lg'>
								<Paper p='lg' withBorder>
									<Stack gap='md'>
										<Title order={5}>Quiz Information</Title>
										<Divider />

										<TextInput
											label='Quiz Name'
											placeholder='Enter quiz name'
											{...form.getInputProps('name')}
										/>

										<Textarea
											label='Description'
											placeholder='Enter quiz description (optional)'
											{...form.getInputProps('intro')}
											autosize
											minRows={4}
											maxRows={10}
										/>

										<Switch
											label='Visible to students'
											{...form.getInputProps('visible', { type: 'checkbox' })}
										/>
									</Stack>
								</Paper>
							</Stack>
						</Grid.Col>

						<Grid.Col span={{ base: 12, md: 4 }}>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconStar size={14} />
										</ThemeIcon>
										<Title order={5}>Summary</Title>
									</Group>
									<Divider />

									<Stack gap='sm'>
										<Group justify='space-between'>
											<Text size='sm' c='dimmed'>
												Total Questions
											</Text>
											<Badge size='lg' variant='light'>
												{allQuestions.length}
											</Badge>
										</Group>

										<Group justify='space-between'>
											<Text size='sm' c='dimmed'>
												Total Marks
											</Text>
											<Badge size='lg' variant='light' color='green'>
												{totalMarks}
											</Badge>
										</Group>

										{pendingNewQuestions.length > 0 && (
											<Group justify='space-between'>
												<Text size='sm' c='dimmed'>
													New Questions
												</Text>
												<Badge size='sm' variant='light' color='blue'>
													+{pendingNewQuestions.length}
												</Badge>
											</Group>
										)}

										{questionsToRemove.length > 0 && (
											<Group justify='space-between'>
												<Text size='sm' c='dimmed'>
													To Remove
												</Text>
												<Badge size='sm' variant='light' color='red'>
													-{questionsToRemove.length}
												</Badge>
											</Group>
										)}
									</Stack>
								</Stack>
							</Paper>
						</Grid.Col>
					</Grid>
				</Tabs.Panel>

				<Tabs.Panel value='questions' pt='lg'>
					<Stack gap='md'>
						<Group justify='space-between'>
							<Badge variant='light'>{totalMarks} marks</Badge>
							<Button
								variant='light'
								size='xs'
								leftSection={<IconPlus size={14} />}
								onClick={addQuestion}
							>
								Add Question
							</Button>
						</Group>

						{allQuestions.length === 0 ? (
							<Paper withBorder p='xl' ta='center'>
								<Stack align='center' gap='sm'>
									<ThemeIcon size='xl' variant='light' color='gray' radius='xl'>
										<IconAlertCircle size={24} />
									</ThemeIcon>
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
							<ScrollArea.Autosize mah={600}>
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
											onUpdate={updateExistingQuestion}
											onDelete={deleteExistingQuestion}
										/>
									))}

									{pendingNewQuestions.map((question, index) => (
										<Box
											key={`new-${question.name}`}
											style={{
												borderLeft: '3px solid var(--mantine-color-green-6)',
												borderRadius: 'var(--mantine-radius-md)',
											}}
										>
											<QuestionCard
												question={question}
												index={form.values.questions.length + index}
												onUpdate={(_, q) => updateNewQuestion(index, q)}
												onDelete={() => deleteNewQuestion(index)}
											/>
										</Box>
									))}
								</Accordion>
							</ScrollArea.Autosize>
						)}
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value='settings' pt='lg'>
					<Grid gutter='lg'>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<Stack gap='lg'>
								<Paper p='lg' withBorder>
									<Stack gap='md'>
										<Title order={5}>Timing</Title>
										<Divider />

										<DateTimePicker
											label='Open Date'
											placeholder='Select when the quiz opens'
											clearable
											{...form.getInputProps('timeopen')}
										/>

										<DateTimePicker
											label='Close Date'
											placeholder='Select when the quiz closes'
											clearable
											{...form.getInputProps('timeclose')}
										/>

										<NumberInput
											label='Time Limit (minutes)'
											placeholder='No limit'
											min={0}
											{...form.getInputProps('timelimit')}
											description='Leave empty or 0 for no time limit'
										/>
									</Stack>
								</Paper>

								<Paper p='lg' withBorder>
									<Stack gap='md'>
										<Title order={5}>Grading</Title>
										<Divider />

										<NumberInput
											label='Maximum Grade'
											placeholder='Auto-calculated from questions'
											min={0}
											{...form.getInputProps('grade')}
											description={`Current total from questions: ${totalMarks}`}
										/>

										<Select
											label='Grading Method'
											description='How grades are calculated when multiple attempts are allowed'
											data={GRADE_METHOD_OPTIONS}
											{...form.getInputProps('gradeMethod')}
										/>
									</Stack>
								</Paper>
							</Stack>
						</Grid.Col>

						<Grid.Col span={{ base: 12, md: 6 }}>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Title order={5}>Attempts</Title>
									<Divider />

									<NumberInput
										label='Allowed Attempts'
										placeholder='Unlimited'
										min={0}
										{...form.getInputProps('attempts')}
										description='0 = unlimited attempts'
									/>

									<Select
										label='Navigation Method'
										description='How students can navigate between questions'
										data={NAV_METHOD_OPTIONS}
										{...form.getInputProps('navMethod')}
									/>

									<Switch
										label='Shuffle answers within questions'
										description='Randomize the order of answer options'
										{...form.getInputProps('shuffleAnswers', {
											type: 'checkbox',
										})}
									/>
								</Stack>
							</Paper>
						</Grid.Col>
					</Grid>
				</Tabs.Panel>
			</Tabs>
		</form>
	);
}
