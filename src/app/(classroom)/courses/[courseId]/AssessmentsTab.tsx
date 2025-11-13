'use client';

import {
	Badge,
	Box,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import type { CourseWork, Topic } from '@/server/classroom/actions';
import { groupCourseWorkByTopic } from './courseWorkGrouping';

type Props = {
	assessments: CourseWork[];
	topics: Topic[];
	courseId: string;
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function getWorkTypeLabel(workType: string | null | undefined) {
	switch (workType) {
		case 'ASSIGNMENT':
			return 'Assignment';
		case 'SHORT_ANSWER_QUESTION':
			return 'Question';
		case 'MULTIPLE_CHOICE_QUESTION':
			return 'Quiz';
		default:
			return 'Work';
	}
}

export default function AssessmentsTab({
	assessments,
	topics,
	courseId,
}: Props) {
	const topicGroups = groupCourseWorkByTopic(assessments, topics);

	if (assessments.length === 0) {
		return (
			<Stack gap='lg'>
				<Group justify='space-between' align='center'>
					<Title order={3} size='h3'>
						Assessments
					</Title>
					<Button leftSection={<IconPlus size='1rem' />} variant='light'>
						Create
					</Button>
				</Group>
				<Paper p='xl' radius='lg' withBorder>
					<Text c='dimmed' ta='center'>
						No assessments yet
					</Text>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='xl'>
			<Group justify='space-between' align='center'>
				<Title order={3} size='h3'>
					Assessments
				</Title>
				<Button leftSection={<IconPlus size='1rem' />} variant='light'>
					Create
				</Button>
			</Group>

			{topicGroups.map((group) => (
				<Box key={group.id}>
					<Group justify='space-between' align='center' mb='md'>
						<Group gap='sm'>
							<Text size='lg' fw={600}>
								{group.name}
							</Text>
							<Badge variant='light' size='md'>
								{group.items.length}
							</Badge>
						</Group>
					</Group>
					<Stack gap='md'>
						{group.items.map((assessment) => {
							const attachmentsCount = assessment.materials?.length || 0;
							const dueLabel = formatDueDate(assessment);

							return (
								<Paper key={assessment.id} withBorder radius='lg' p='lg'>
									<Stack gap='md'>
										<Group justify='space-between' align='flex-start'>
											<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
												<Text size='sm' fw={600}>
													{assessment.title}
												</Text>
												{assessment.description && (
													<Text
														size='sm'
														c='dimmed'
														style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
														dangerouslySetInnerHTML={{
															__html: assessment.description,
														}}
													/>
												)}
											</Stack>
											<Button
												component={Link}
												href={`/courses/${courseId}/${assessment.id}`}
												variant='light'
												size='sm'
											>
												View details
											</Button>
										</Group>

										<Group gap='xs' wrap='wrap'>
											<Badge size='sm' variant='light'>
												{getWorkTypeLabel(assessment.workType)}
											</Badge>
											{assessment.maxPoints !== null &&
												assessment.maxPoints !== undefined && (
													<Badge size='sm' variant='outline'>
														{assessment.maxPoints} pts
													</Badge>
												)}
											{attachmentsCount > 0 && (
												<Badge size='sm' variant='outline'>
													{attachmentsCount} attachment
													{attachmentsCount > 1 ? 's' : ''}
												</Badge>
											)}
											{assessment.creationTime && (
												<Text size='xs' c='dimmed'>
													Posted {formatDate(assessment.creationTime)}
												</Text>
											)}
										</Group>

										{dueLabel && (
											<Group gap='xs'>
												<Text size='sm' fw={500}>
													Due
												</Text>
												<Text size='sm' c='dimmed'>
													{dueLabel}
												</Text>
											</Group>
										)}
									</Stack>
								</Paper>
							);
						})}
					</Stack>
				</Box>
			))}
		</Stack>
	);
}

function formatDueDate(courseWork: CourseWork) {
	if (!courseWork.dueDate) return '';
	const year = courseWork.dueDate.year || 0;
	const month = (courseWork.dueDate.month || 1) - 1;
	const day = courseWork.dueDate.day || 1;
	const hours = courseWork.dueTime?.hours ?? 23;
	const minutes = courseWork.dueTime?.minutes ?? 59;
	const due = new Date(year, month, day, hours, minutes);
	return due.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}
