'use client';

import { ActionIcon, Box, Card, Group, Menu, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconClock,
	IconDotsVertical,
	IconEdit,
	IconExternalLink,
	IconTrash,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
	deleteAssessment,
	getAssessmentByLmsId,
} from '@/app/academic/assessments/_server/actions';
import { getBooleanColor } from '@/shared/lib/utils/colors';
import { DeleteModal } from '@/shared/ui/adease';
import { deleteAssignment } from '../../_server/actions';
import type { MoodleAssignment } from '../../types';
import AssignmentStatus from '../details/AssignmentStatus';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};

export default function AssignmentCard({ assignment, courseId }: Props) {
	const dueDate = assignment.duedate
		? new Date(assignment.duedate * 1000)
		: null;
	const isOverdue = dueDate && dueDate < new Date();
	const queryClient = useQueryClient();
	const [deleteOpened, { open: openDelete, close: closeDelete }] =
		useDisclosure(false);

	async function handleDelete() {
		const assessment = await getAssessmentByLmsId(assignment.id);
		if (assessment) {
			await deleteAssessment(assessment.id);
		}
		await deleteAssignment(assignment.cmid!);
		queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
	}

	function handleViewInMoodle() {
		const moodleUrl = process.env.NEXT_PUBLIC_MOODLE_URL;
		window.open(
			`${moodleUrl}/mod/assign/view.php?id=${assignment.cmid}`,
			'_blank'
		);
	}

	return (
		<>
			<DeleteModal
				opened={deleteOpened}
				onClose={closeDelete}
				onDelete={handleDelete}
				itemName={assignment.name}
				itemType='assignment'
				warningMessage='This will also delete the associated assessment and all student marks. This action cannot be undone.'
			/>
			<Card padding='md' withBorder>
				<Stack gap='sm'>
					<Card.Section withBorder inheritPadding py='xs'>
						<Group justify='space-between' wrap='nowrap'>
							<Box
								component={Link}
								href={`/lms/courses/${courseId}/assignments/${assignment.id}`}
								style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
							>
								<Text fw={500} size='md'>
									{assignment.name}
								</Text>
							</Box>
							<Group gap='xs' wrap='nowrap'>
								<AssignmentStatus
									assignment={assignment}
									size='sm'
									variant='light'
								/>
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
											href={`/lms/courses/${courseId}/assignments/${assignment.id}/edit`}
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
						href={`/lms/courses/${courseId}/assignments/${assignment.id}`}
						style={{ textDecoration: 'none', color: 'inherit' }}
					>
						{assignment.intro ? (
							<Text py='xs' size='sm' lineClamp={2}>
								{shorten(assignment.intro)}
							</Text>
						) : (
							<Text py='xs' size='sm' c='dimmed'>
								No Description
							</Text>
						)}
					</Box>

					<Card.Section withBorder inheritPadding py='xs'>
						<Group gap='xl'>
							{dueDate && (
								<Group gap='xs'>
									<IconClock size={16} />
									<Text size='xs' c={getBooleanColor(!!isOverdue, 'negative')}>
										Due: {dueDate.toLocaleDateString()} at{' '}
										{dueDate.toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})}
									</Text>
								</Group>
							)}
						</Group>
					</Card.Section>
				</Stack>
			</Card>
		</>
	);
}

function shorten(html: string): string {
	const text = html.replace(/<[^>]*>/g, '');
	return text.length > 90 ? `${text.substring(0, 90)}...` : text;
}
