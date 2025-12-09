'use client';

import {
	ActionIcon,
	Box,
	Card,
	Group,
	Menu,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import {
	IconClock,
	IconDotsVertical,
	IconEdit,
	IconExternalLink,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import {
	deleteAssessment,
	getAssessmentByLmsId,
} from '@/modules/academic/features/assessments/server/actions';
import { deleteAssignment } from '../../server/actions';
import type { MoodleAssignment } from '../../types';
import AssignmentStatus from '../details/AssignmentStatus';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};

function DeleteConfirmContent({
	assignmentName,
	onConfirmChange,
}: {
	assignmentName: string;
	onConfirmChange: (isValid: boolean) => void;
}) {
	const [value, setValue] = useState('');

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const newValue = e.target.value;
		setValue(newValue);
		onConfirmChange(newValue === 'delete permanently');
	}

	return (
		<Stack gap='md'>
			<Text size='sm'>
				Are you sure you want to delete "{assignmentName}"? This will also
				delete the associated assessment and all student marks.
			</Text>
			<Text size='sm' fw={500}>
				Type "delete permanently" to confirm:
			</Text>
			<TextInput
				placeholder='delete permanently'
				value={value}
				onChange={handleChange}
				data-autofocus
			/>
		</Stack>
	);
}

export default function AssignmentCard({ assignment, courseId }: Props) {
	const dueDate = assignment.duedate
		? new Date(assignment.duedate * 1000)
		: null;
	const isOverdue = dueDate && dueDate < new Date();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const assessment = await getAssessmentByLmsId(assignment.id);
			if (assessment) {
				await deleteAssessment(assessment.id);
			}
			await deleteAssignment(assignment.cmid!);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
		},
	});

	function handleDelete() {
		let canConfirm = false;

		modals.openConfirmModal({
			title: 'Delete Assignment',
			children: (
				<DeleteConfirmContent
					assignmentName={assignment.name}
					onConfirmChange={(isValid) => {
						canConfirm = isValid;
					}}
				/>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => {
				if (canConfirm) {
					deleteMutation.mutate();
				} else {
					modals.open({
						title: 'Deletion Cancelled',
						children: (
							<Text size='sm'>
								Please type "delete permanently" to confirm deletion.
							</Text>
						),
					});
				}
			},
		});
	}

	function handleViewInMoodle() {
		const moodleUrl = process.env.NEXT_PUBLIC_MOODLE_URL;
		window.open(
			`${moodleUrl}/mod/assign/view.php?id=${assignment.cmid}`,
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
										onClick={handleDelete}
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
								<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
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
	);
}

function shorten(html: string): string {
	const text = html.replace(/<[^>]*>/g, '');
	return text.length > 90 ? `${text.substring(0, 90)}...` : text;
}
