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
	IconClipboardCheck,
	IconDeviceFloppy,
	IconEdit,
	IconFileDescription,
	IconPlus,
	IconRuler2,
	IconStar,
	IconUsers,
	IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useRef, useState } from 'react';
import { formatMoodleDate } from '@/shared/lib/utils/dates';
import { DeleteButton } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import { deleteRubric, getRubric, RubricView } from '../../_features/rubric';
import { SubmissionsView } from '../../_features/submissions';
import type { MoodleAssignment } from '../../types';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};

export default function AssignmentTabs({ assignment, courseId }: Props) {
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'details',
	});
	const [isEditingRubric, setIsEditingRubric] = useState(false);
	const rubricFormRef = useRef<{ submit: () => void } | null>(null);

	const { data: rubric } = useQuery({
		queryKey: ['rubric', assignment.cmid],
		queryFn: () => getRubric(assignment.cmid!),
		enabled: !!assignment.cmid,
	});

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
			<Tabs.List>
				<Tabs.Tab
					value='details'
					leftSection={<IconFileDescription size={16} />}
				>
					Details
				</Tabs.Tab>
				<Tabs.Tab value='rubric' leftSection={<IconRuler2 size={16} />}>
					Rubric
				</Tabs.Tab>
				<Tabs.Tab value='submissions' leftSection={<IconUsers size={16} />}>
					Submissions
				</Tabs.Tab>

				{activeTab === 'details' && (
					<Box ml='auto' mt={-5}>
						<Button
							component={Link}
							href={`/lms/courses/${courseId}/assignments/${assignment.id}/edit`}
							variant='light'
							leftSection={<IconEdit size={16} />}
							size='xs'
						>
							Edit
						</Button>
					</Box>
				)}

				{activeTab === 'rubric' && !isEditingRubric && !rubric && (
					<Box ml='auto' mt={-5}>
						<Button
							variant='light'
							leftSection={<IconPlus size={16} />}
							size='xs'
							onClick={() => setIsEditingRubric(true)}
						>
							Create
						</Button>
					</Box>
				)}

				{activeTab === 'rubric' && !isEditingRubric && rubric && (
					<Group ml='auto' mb={10} gap='xs'>
						<Button
							variant='light'
							onClick={() => setIsEditingRubric(true)}
							size='xs'
							leftSection={<IconEdit size={16} />}
						>
							Edit
						</Button>
						<DeleteButton
							variant='subtle'
							handleDelete={() => deleteRubric(assignment.cmid!)}
							message='Are you sure you want to delete this rubric?'
							queryKey={['rubric', String(assignment.cmid)]}
						/>
					</Group>
				)}

				{activeTab === 'rubric' && isEditingRubric && (
					<Group ml='auto' mt={-5} gap='xs'>
						<Button
							variant='light'
							size='xs'
							onClick={() => rubricFormRef.current?.submit()}
							leftSection={<IconDeviceFloppy size={16} />}
						>
							Save
						</Button>
						<Button
							variant='subtle'
							color='gray'
							size='xs'
							onClick={() => setIsEditingRubric(false)}
							leftSection={<IconX size={16} />}
						>
							Cancel
						</Button>
					</Group>
				)}
			</Tabs.List>

			<Tabs.Panel value='details' pt='lg'>
				<Grid gutter='lg'>
					<Grid.Col span={{ base: 12, md: 8 }}>
						<Paper p='lg' withBorder>
							<Stack gap='md'>
								<Group gap='xs'>
									<ThemeIcon size='sm' variant='light' color='gray'>
										<IconFileDescription size={14} />
									</ThemeIcon>
									<Title order={5}>Description</Title>
								</Group>
								<Divider />
								{assignment.intro ? (
									<Box
										dangerouslySetInnerHTML={{ __html: assignment.intro }}
										style={{ fontSize: '0.875rem' }}
									/>
								) : (
									<Text c='dimmed' size='sm'>
										No description provided for this assignment.
									</Text>
								)}
							</Stack>
						</Paper>
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
												{assignment.allowsubmissionsfromdate
													? formatMoodleDate(
															assignment.allowsubmissionsfromdate
														)
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
													Due Date
												</Text>
											</Group>
											<Text size='sm'>
												{assignment.duedate
													? formatMoodleDate(assignment.duedate)
													: 'Not set'}
											</Text>
										</Box>
										{assignment.cutoffdate && assignment.cutoffdate > 0 && (
											<Box>
												<Group gap='xs' mb={4}>
													<IconClipboardCheck
														size={14}
														color='var(--mantine-color-orange-6)'
													/>
													<Text size='xs' fw={500} c='dimmed'>
														Cut-off Date
													</Text>
												</Group>
												<Text size='sm'>
													{formatMoodleDate(assignment.cutoffdate)}
												</Text>
											</Box>
										)}
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
									<Box>
										<Text size='xs' fw={500} c='dimmed' mb={4}>
											Maximum Grade
										</Text>
										<Text size='lg' fw={600}>
											{assignment.grade > 0 ? assignment.grade : 'Not graded'}
										</Text>
									</Box>
								</Stack>
							</Paper>
						</Stack>
					</Grid.Col>
				</Grid>
			</Tabs.Panel>

			<Tabs.Panel value='submissions' pt='lg'>
				<SubmissionsView
					assignmentId={assignment.id}
					courseId={courseId}
					maxGrade={assignment.grade > 0 ? assignment.grade : 100}
					cmid={assignment.cmid}
				/>
			</Tabs.Panel>

			<Tabs.Panel value='rubric' pt='lg'>
				{assignment.cmid && (
					<RubricView
						cmid={assignment.cmid}
						maxGrade={assignment.grade > 0 ? assignment.grade : 100}
						assignmentName={assignment.name}
						isEditing={isEditingRubric}
						setIsEditing={setIsEditingRubric}
						formRef={rubricFormRef}
					/>
				)}
			</Tabs.Panel>
		</Tabs>
	);
}
