'use client';

import {
	Box,
	Button,
	Divider,
	Grid,
	Group,
	Paper,
	Stack,
	Tabs,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconCalendarDue,
	IconCalendarEvent,
	IconClock,
	IconEdit,
	IconEye,
	IconRefresh,
	IconStar,
	IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { formatMoodleDate } from '@/shared/lib/utils/dates';
import type { MoodleQuiz } from '../../types';
import { QuizSubmissionsView } from '../submission';
import QuestionPreview from './QuestionPreview';

type Props = {
	quiz: MoodleQuiz;
	courseId: number;
};

function formatDuration(seconds: number): string {
	if (seconds === 0) return 'No time limit';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} minutes`;
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0
		? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
		: `${hours} hour${hours > 1 ? 's' : ''}`;
}

function getGradeMethodLabel(method: number): string {
	switch (method) {
		case 1:
			return 'Highest grade';
		case 2:
			return 'Average grade';
		case 3:
			return 'First attempt';
		case 4:
			return 'Last attempt';
		default:
			return 'Unknown';
	}
}

export default function QuizTabs({ quiz, courseId }: Props) {
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'preview',
	});

	const questionsCount = quiz.questions?.length || 0;

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
			<Tabs.List>
				<Tabs.Tab value='preview' leftSection={<IconEye size={16} />}>
					Preview
				</Tabs.Tab>
				<Tabs.Tab value='submissions' leftSection={<IconUsers size={16} />}>
					Submissions
				</Tabs.Tab>

				{activeTab === 'preview' && (
					<Box ml='auto' mt={-5}>
						<Button
							component={Link}
							href={`/lms/courses/${courseId}/quizzes/${quiz.id}/edit`}
							variant='light'
							leftSection={<IconEdit size={16} />}
							size='xs'
						>
							Edit
						</Button>
					</Box>
				)}
			</Tabs.List>

			<Tabs.Panel value='preview' pt='lg'>
				<Grid gutter='lg'>
					<Grid.Col span={{ base: 12, md: 8 }}>
						<QuestionPreview questions={quiz.questions || []} />
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 4 }}>
						<Stack gap='md'>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconCalendarEvent size={14} />
										</ThemeIcon>
										<Title order={5}>Timeline</Title>
									</Group>
									<Divider />
									<Stack gap='sm'>
										<Box>
											<Group gap='xs' mb={4}>
												<IconCalendarEvent
													size={14}
													color='var(--mantine-color-green-6)'
												/>
												<Text size='xs' fw={500} c='dimmed'>
													Opens
												</Text>
											</Group>
											<Text size='sm'>
												{quiz.timeopen
													? formatMoodleDate(quiz.timeopen)
													: 'Not set'}
											</Text>
										</Box>
										<Box>
											<Group gap='xs' mb={4}>
												<IconCalendarDue
													size={14}
													color='var(--mantine-color-red-6)'
												/>
												<Text size='xs' fw={500} c='dimmed'>
													Closes
												</Text>
											</Group>
											<Text size='sm'>
												{quiz.timeclose
													? formatMoodleDate(quiz.timeclose)
													: 'Not set'}
											</Text>
										</Box>
										<Box>
											<Group gap='xs' mb={4}>
												<IconClock
													size={14}
													color='var(--mantine-color-blue-6)'
												/>
												<Text size='xs' fw={500} c='dimmed'>
													Time Limit
												</Text>
											</Group>
											<Text size='sm'>{formatDuration(quiz.timelimit)}</Text>
										</Box>
									</Stack>
								</Stack>
							</Paper>

							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconStar size={14} />
										</ThemeIcon>
										<Title order={5}>Grading</Title>
									</Group>
									<Divider />
									<Stack gap='sm'>
										<Box>
											<Text size='xs' fw={500} c='dimmed' mb={4}>
												Total Questions
											</Text>
											<Text size='lg' fw={600}>
												{questionsCount}
											</Text>
										</Box>
										<Box>
											<Text size='xs' fw={500} c='dimmed' mb={4}>
												Maximum Grade
											</Text>
											<Text size='lg' fw={600}>
												{quiz.grade > 0 ? quiz.grade : 'Not graded'}
											</Text>
										</Box>
										<Box>
											<Text size='xs' fw={500} c='dimmed' mb={4}>
												Grading Method
											</Text>
											<Text size='sm'>
												{getGradeMethodLabel(quiz.grademethod)}
											</Text>
										</Box>
									</Stack>
								</Stack>
							</Paper>

							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconRefresh size={14} />
										</ThemeIcon>
										<Title order={5}>Attempts</Title>
									</Group>
									<Divider />
									<Stack gap='sm'>
										<Box>
											<Text size='xs' fw={500} c='dimmed' mb={4}>
												Attempts Allowed
											</Text>
											<Text size='sm'>
												{quiz.attempts === 0 ? 'Unlimited' : quiz.attempts}
											</Text>
										</Box>
										{quiz.attemptcount !== undefined && (
											<Box>
												<Text size='xs' fw={500} c='dimmed' mb={4}>
													Attempts Made
												</Text>
												<Text size='sm'>{quiz.attemptcount}</Text>
											</Box>
										)}
									</Stack>
								</Stack>
							</Paper>
						</Stack>
					</Grid.Col>
				</Grid>
			</Tabs.Panel>

			<Tabs.Panel value='submissions' pt='lg'>
				<QuizSubmissionsView
					quizId={quiz.id}
					courseId={courseId}
					maxGrade={quiz.grade}
				/>
			</Tabs.Panel>
		</Tabs>
	);
}
