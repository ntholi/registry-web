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
	materials: CourseWork[];
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

export default function MaterialTab({ materials, topics, courseId }: Props) {
	const topicGroups = groupCourseWorkByTopic(materials, topics);

	if (materials.length === 0) {
		return (
			<Stack gap='lg'>
				<Group justify='space-between' align='center'>
					<Title order={3} size='h3'>
						Material
					</Title>
					<Button leftSection={<IconPlus size='1rem' />} variant='light'>
						Create
					</Button>
				</Group>
				<Paper p='xl' radius='lg' withBorder>
					<Text c='dimmed' ta='center'>
						No materials yet
					</Text>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='xl'>
			<Group justify='space-between' align='center'>
				<Title order={3} size='h3'>
					Material
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
						{group.items.map((material) => {
							const attachmentsCount = material.materials?.length || 0;

							return (
								<Paper key={material.id} withBorder radius='lg' p='lg'>
									<Stack gap='md'>
										<Group justify='space-between' align='flex-start'>
											<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
												<Text size='sm' fw={600}>
													{material.title}
												</Text>
												{material.description && (
													<Text
														size='sm'
														c='dimmed'
														style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
														dangerouslySetInnerHTML={{
															__html: material.description,
														}}
													/>
												)}
											</Stack>
											<Button
												component={Link}
												href={`/courses/${courseId}/${material.id}`}
												variant='light'
												size='sm'
											>
												View details
											</Button>
										</Group>

										<Group gap='xs' wrap='wrap'>
											<Badge size='sm' variant='light'>
												Material
											</Badge>
											{attachmentsCount > 0 && (
												<Badge size='sm' variant='outline'>
													{attachmentsCount} attachment
													{attachmentsCount > 1 ? 's' : ''}
												</Badge>
											)}
											{material.creationTime && (
												<Text size='xs' c='dimmed'>
													Posted {formatDate(material.creationTime)}
												</Text>
											)}
										</Group>
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
