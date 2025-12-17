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
import { useDisclosure } from '@mantine/hooks';
import {
	IconClock,
	IconDotsVertical,
	IconEdit,
	IconExternalLink,
	IconTrash,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import {
	deleteAssessment,
	getAssessmentByLmsId,
} from '@/modules/academic/features/assessments/server/actions';
import { DeleteModal } from '@/shared/ui/adease';
import { deleteQuiz } from '../../server/actions';
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

	if (quiz.timeopen > 0 && now < quiz.timeopen) {
		return { label: 'Not yet open', color: 'gray' };
	}

	if (quiz.timeclose > 0 && now > quiz.timeclose) {
		return { label: 'Closed', color: 'red' };
	}

	return { label: 'Open', color: 'green' };
}

export default function QuizCard({ quiz, courseId }: Props) {
	const status = getQuizStatus(quiz);
	const openDate = quiz.timeopen ? new Date(quiz.timeopen * 1000) : null;
	const closeDate = quiz.timeclose ? new Date(quiz.timeclose * 1000) : null;
	const isOverdue = closeDate && closeDate < new Date();
	const queryClient = useQueryClient();
	const [deleteOpened, { open: openDelete, close: closeDelete }] =
		useDisclosure(false);

	async function handleDelete() {
		const assessment = await getAssessmentByLmsId(quiz.id);
		if (assessment) {
			await deleteAssessment(assessment.id);
		}
		await deleteQuiz(quiz.coursemoduleid);
		queryClient.invalidateQueries({ queryKey: ['course-quizzes'] });
	}

	function handleViewInMoodle() {
		const moodleUrl = process.env.NEXT_PUBLIC_MOODLE_URL;
		window.open(
			`${moodleUrl}/mod/quiz/view.php?id=${quiz.coursemoduleid}`,
			'_blank'
		);
	}

	return (
		<>
			<DeleteModal
				opened={deleteOpened}
				onClose={closeDelete}
				onDelete={handleDelete}
				itemName={quiz.name}
				itemType='quiz'
				warningMessage='This will also delete the associated assessment and all student marks. This action cannot be undone.'
			/>
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
										<Menu.Divider />
										<Menu.Item
											leftSection={<IconTrash size={14} />}
											color='red'
											onClick={openDelete}
										>
											Delete
										</Menu.Item>
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
									<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
										Closes: {dayjs(closeDate).format('DD MMM [at] HH:mm')}
									</Text>
								)}
							</Flex>
						</Group>
					</Card.Section>
				</Stack>
			</Card>
		</>
	);
}
