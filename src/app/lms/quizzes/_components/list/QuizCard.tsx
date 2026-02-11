'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Card,
	Flex,
	Group,
	Menu,
	Stack,
	Text,
} from '@mantine/core';
import {
	IconClock,
	IconDotsVertical,
	IconEdit,
	IconExternalLink,
	IconSend,
	IconTrash,
} from '@tabler/icons-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import {
	deleteAssessment,
	getAssessmentByLmsId,
} from '@/app/academic/assessments/_server/actions';
import { getBooleanColor, getQuizStatusColor } from '@/shared/lib/utils/colors';
import { notifications } from '@mantine/notifications';
import { DeleteButton } from '@/shared/ui/adease';
import { deleteQuiz, updateQuiz } from '../../_server/actions';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
	courseId: number;
};

function formatDuration(seconds: number): string {
	if (seconds === 0) return 'No limit';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getQuizStatus(quiz: MoodleQuiz): {
	label: string;
	color: string;
} {
	const now = Date.now() / 1000;
	const isNotYetOpen = quiz.timeopen > 0 && now < quiz.timeopen;
	const isClosed = quiz.timeclose > 0 && now > quiz.timeclose;
	const isDraft = quiz.visible === 0;
	return getQuizStatusColor(isNotYetOpen, isClosed, isDraft);
}

export default function QuizCard({ quiz, courseId }: Props) {
	const status = getQuizStatus(quiz);
	const openDate = quiz.timeopen ? new Date(quiz.timeopen * 1000) : null;
	const closeDate = quiz.timeclose ? new Date(quiz.timeclose * 1000) : null;
	const isOverdue = closeDate && closeDate < new Date();
	const queryClient = useQueryClient();

	const isDraft = quiz.visible === 0;

	async function handleDelete() {
		const assessment = await getAssessmentByLmsId(quiz.id);
		if (assessment) {
			await deleteAssessment(assessment.id);
		}
		await deleteQuiz(quiz.coursemoduleid);
		queryClient.invalidateQueries({ queryKey: ['course-quizzes'] });
	}

	const publishMutation = useMutation({
		mutationFn: () => updateQuiz(quiz.id, { visible: true }),
		onSuccess: () => {
			notifications.show({ message: 'Quiz published', color: 'green' });
			queryClient.invalidateQueries({ queryKey: ['course-quizzes'] });
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to publish quiz',
				color: 'red',
			});
		},
	});

	function handleViewInMoodle() {
		const moodleUrl = process.env.NEXT_PUBLIC_MOODLE_URL;
		window.open(
			`${moodleUrl}/mod/quiz/view.php?id=${quiz.coursemoduleid}`,
			'_blank'
		);
	}

	return (
		<Card padding='md' withBorder>
			<Stack gap='sm'>
				<Card.Section withBorder inheritPadding py='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Box
							component={Link}
							href={`/lms/courses/${courseId}/quizzes/${quiz.id}`}
							style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
						>
							<Text fw={500} size='md'>
								{quiz.name}
							</Text>
						</Box>
						<Group gap='xs' wrap='nowrap'>
							<Badge size='sm' variant='light' color={status.color}>
								{status.label}
							</Badge>
							<Menu position='bottom-end' withArrow shadow='md'>
								<Menu.Target>
									<ActionIcon
										variant='subtle'
										color='gray'
										size='sm'
										onClick={(e) => e.preventDefault()}
									>
										<IconDotsVertical size={16} />
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										leftSection={<IconEdit size={14} />}
										component={Link}
										href={`/lms/courses/${courseId}/quizzes/${quiz.id}/edit`}
									>
										Edit
									</Menu.Item>
									<Menu.Item
										leftSection={<IconExternalLink size={14} />}
										onClick={handleViewInMoodle}
									>
										View in Moodle
									</Menu.Item>
									{isDraft && (
										<Menu.Item
											leftSection={<IconSend size={14} />}
											color='green'
											onClick={() => publishMutation.mutate()}
											disabled={publishMutation.isPending}
										>
											{publishMutation.isPending ? 'Publishing...' : 'Publish'}
										</Menu.Item>
									)}
									<Menu.Divider />
									<DeleteButton
										handleDelete={handleDelete}
										itemName={quiz.name}
										itemType='quiz'
										warningMessage='This will also delete the associated assessment and all student marks. This action cannot be undone.'
									>
										<Menu.Item
											leftSection={<IconTrash size={14} />}
											color='red'
										>
											Delete
										</Menu.Item>
									</DeleteButton>
								</Menu.Dropdown>
							</Menu>
						</Group>
					</Group>
				</Card.Section>

				<Box
					component={Link}
					href={`/lms/courses/${courseId}/quizzes/${quiz.id}`}
					style={{ textDecoration: 'none', color: 'inherit' }}
				>
					<Group justify='s' gap='lg' py='xs'>
						{quiz.timelimit > 0 && (
							<Text size='sm' c='dimmed'>
								Duration:{' '}
								<Text component='span' c='bright'>
									{formatDuration(quiz.timelimit)}
								</Text>
							</Text>
						)}
					</Group>
				</Box>

				<Card.Section withBorder inheritPadding py='xs'>
					<Group>
						<IconClock size={16} />
						<Flex flex={1} gap='xl' justify={'space-between'}>
							{openDate && (
								<Text size='xs' c='dimmed'>
									Opens: {dayjs(openDate).format('DD MMM [at] HH:mm')}
								</Text>
							)}
							{closeDate && (
								<Text size='xs' c={getBooleanColor(!!isOverdue, 'negative')}>
									Closes: {dayjs(closeDate).format('DD MMM [at] HH:mm')}
								</Text>
							)}
						</Flex>
					</Group>
				</Card.Section>
			</Stack>
		</Card>
	);
}
