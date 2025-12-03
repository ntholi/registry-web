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
	IconEdit,
	IconFileDescription,
	IconRuler2,
	IconStar,
	IconUsers,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { MoodleAssignment } from '../../types';
import RubricView from '../rubric';
import SubmissionsView from '../submission';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};

export default function AssessmentTabs({ assignment, courseId }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('details');
	const dueDate = assignment.duedate
		? new Date(assignment.duedate * 1000)
		: null;
	const availableFrom = assignment.allowsubmissionsfromdate
		? new Date(assignment.allowsubmissionsfromdate * 1000)
		: null;
	const cutoffDate = assignment.cutoffdate
		? new Date(assignment.cutoffdate * 1000)
		: null;

	function formatDate(date: Date | null) {
		if (!date) return 'Not set';
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

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
					<Box ml={'auto'} mt={-5}>
						<Button
							variant='light'
							leftSection={<IconEdit size={16} />}
							size='xs'
						>
							Edit
						</Button>
					</Box>
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
										No description provided for this assessment.
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
											<Text size='sm'>{formatDate(availableFrom)}</Text>
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
											<Text size='sm'>{formatDate(dueDate)}</Text>
										</Box>
										{cutoffDate && cutoffDate.getTime() > 0 && (
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
												<Text size='sm'>{formatDate(cutoffDate)}</Text>
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
				/>
			</Tabs.Panel>

			<Tabs.Panel value='rubric' pt='lg'>
				{assignment.cmid && (
					<RubricView
						cmid={assignment.cmid}
						maxGrade={assignment.grade > 0 ? assignment.grade : 100}
					/>
				)}
			</Tabs.Panel>
		</Tabs>
	);
}
