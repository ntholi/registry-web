'use client';

import {
	Badge,
	Box,
	Button,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCheckbox,
	IconClipboardList,
	IconHelp,
	IconPaperclip,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { CourseWork } from '../../server/actions';
import { getCourseTopics, getCourseWork } from '../../server/actions';
import { groupCourseWorkByTopic } from './courseWorkGrouping';

type Props = {
	courseId: string;
};

function AssessmentsSkeleton() {
	return (
		<Stack gap='lg'>
			<Skeleton height={40} width={200} radius='md' />
			{[0, 1, 2, 3].map((i) => (
				<Skeleton key={i} height={120} radius='lg' />
			))}
		</Stack>
	);
}

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function getWorkTypeConfig(workType: string | null | undefined) {
	switch (workType) {
		case 'ASSIGNMENT':
			return { label: 'Assignment', icon: IconClipboardList, color: 'blue' };
		case 'SHORT_ANSWER_QUESTION':
			return { label: 'Question', icon: IconHelp, color: 'orange' };
		case 'MULTIPLE_CHOICE_QUESTION':
			return { label: 'Quiz', icon: IconCheckbox, color: 'violet' };
		default:
			return { label: 'Work', icon: IconClipboardList, color: 'gray' };
	}
}

export default function AssessmentsTab({ courseId }: Props) {
	const { data: courseWork, isLoading: isLoadingCourseWork } = useQuery({
		queryKey: ['course-work', courseId],
		queryFn: () => getCourseWork(courseId),
	});

	const { data: topics, isLoading: isLoadingTopics } = useQuery({
		queryKey: ['course-topics', courseId],
		queryFn: () => getCourseTopics(courseId),
	});

	const isLoading = isLoadingCourseWork || isLoadingTopics;

	if (isLoading) {
		return <AssessmentsSkeleton />;
	}

	const assessments =
		courseWork?.filter(
			(work) =>
				work.workType === 'ASSIGNMENT' ||
				work.workType === 'SHORT_ANSWER_QUESTION' ||
				work.workType === 'MULTIPLE_CHOICE_QUESTION'
		) || [];

	const topicGroups = groupCourseWorkByTopic(assessments, topics || []);

	if (assessments.length === 0) {
		return (
			<Paper p='xl' radius='md' withBorder>
				<Stack align='center' gap='md'>
					<ThemeIcon size={48} radius='xl' variant='light' color='gray'>
						<IconClipboardList size={24} />
					</ThemeIcon>
					<Text c='dimmed' ta='center'>
						No assessments yet
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='xl'>
			{topicGroups.map((group) => (
				<Box key={group.id}>
					<Group justify='space-between' align='center' mb='md'>
						<Group gap='xs'>
							<Text size='lg' fw={600} c='dark.4'>
								{group.name}
							</Text>
							<Badge variant='light' color='gray' size='sm' circle>
								{group.items.length}
							</Badge>
						</Group>
					</Group>
					<Stack gap='sm'>
						{group.items.map((assessment) => {
							const attachmentsCount = assessment.materials?.length || 0;
							const dueLabel = formatDueDate(assessment);
							const {
								icon: TypeIcon,
								color,
								label,
							} = getWorkTypeConfig(assessment.workType);

							return (
								<Paper
									key={assessment.id}
									withBorder
									radius='md'
									p='md'
									shadow='xs'
									style={{ transition: 'transform 0.2s ease' }}
								>
									<Group wrap='nowrap' align='flex-start'>
										<ThemeIcon
											size='lg'
											radius='md'
											variant='light'
											color={color}
											mt={4}
										>
											<TypeIcon size='1.1rem' />
										</ThemeIcon>

										<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
											<Group justify='space-between' align='flex-start'>
												<Box>
													<Text size='sm' fw={600} lineClamp={1}>
														{assessment.title}
													</Text>
													<Group gap='xs' mt={2}>
														<Text size='xs' c='dimmed' fw={500}>
															{label}
														</Text>
														<Text size='xs' c='dimmed'>
															•
														</Text>
														<Text size='xs' c='dimmed'>
															Posted {formatDate(assessment.creationTime)}
														</Text>
													</Group>
												</Box>
												<Button
													component={Link}
													href={`/courses/${courseId}/${assessment.id}`}
													variant='subtle'
													size='xs'
													color='gray'
												>
													View
												</Button>
											</Group>

											<Group gap='sm'>
												{dueLabel && (
													<Badge
														size='sm'
														variant='dot'
														color='red'
														radius='sm'
													>
														Due {dueLabel}
													</Badge>
												)}
												{assessment.maxPoints !== null &&
													assessment.maxPoints !== undefined && (
														<Badge
															size='sm'
															variant='outline'
															color='gray'
															radius='sm'
														>
															{assessment.maxPoints} pts
														</Badge>
													)}
												{attachmentsCount > 0 && (
													<Group gap={4}>
														<IconPaperclip size={14} color='gray' />
														<Text size='xs' c='dimmed'>
															{attachmentsCount}
														</Text>
													</Group>
												)}
											</Group>
										</Stack>
									</Group>
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
