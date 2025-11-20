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
	Title,
} from '@mantine/core';
import { IconBook2, IconPaperclip, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { CourseWork, Topic } from '../../server/actions';
import { getCourseTopics, getCourseWork } from '../../server/actions';
import { groupCourseWorkByTopic } from './courseWorkGrouping';

type Props = {
	courseId: string;
};

function MaterialSkeleton() {
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

export default function MaterialTab({ courseId }: Props) {
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
		return <MaterialSkeleton />;
	}

	const materials =
		courseWork?.filter((work) => work.workType === 'MATERIAL') || [];

	const topicGroups = groupCourseWorkByTopic(materials, topics || []);

	if (materials.length === 0) {
		return (
			<Stack gap='lg'>
				<Group justify='space-between' align='center'>
					<Title order={3} size='h4'>
						Material
					</Title>
					<Button
						leftSection={<IconPlus size='1rem' />}
						variant='filled'
						color='black'
						size='xs'
					>
						Create
					</Button>
				</Group>
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='md'>
						<ThemeIcon size={48} radius='xl' variant='light' color='gray'>
							<IconBook2 size={24} />
						</ThemeIcon>
						<Text c='dimmed' ta='center'>
							No materials yet
						</Text>
					</Stack>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='xl'>
			<Group justify='space-between' align='center'>
				<Title order={3} size='h4'>
					Material
				</Title>
				<Button
					leftSection={<IconPlus size='1rem' />}
					variant='filled'
					color='black'
					size='xs'
				>
					Create
				</Button>
			</Group>

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
						{group.items.map((material) => {
							const attachmentsCount = material.materials?.length || 0;

							return (
								<Paper
									key={material.id}
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
											color='teal'
											mt={4}
										>
											<IconBook2 size='1.1rem' />
										</ThemeIcon>

										<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
											<Group justify='space-between' align='flex-start'>
												<Box>
													<Text size='sm' fw={600} lineClamp={1}>
														{material.title}
													</Text>
													<Group gap='xs' mt={2}>
														<Text size='xs' c='dimmed' fw={500}>
															Material
														</Text>
														<Text size='xs' c='dimmed'>
															•
														</Text>
														<Text size='xs' c='dimmed'>
															Posted {formatDate(material.creationTime)}
														</Text>
													</Group>
												</Box>
												<Button
													component={Link}
													href={`/courses/${courseId}/${material.id}`}
													variant='subtle'
													size='xs'
													color='gray'
												>
													View
												</Button>
											</Group>

											{attachmentsCount > 0 && (
												<Group gap={4}>
													<IconPaperclip size={14} color='gray' />
													<Text size='xs' c='dimmed'>
														{attachmentsCount} attachment
														{attachmentsCount > 1 ? 's' : ''}
													</Text>
												</Group>
											)}
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
