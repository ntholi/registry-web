'use client';

import {
	Box,
	Button,
	Divider,
	Grid,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	Switch,
	Tabs,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
	IconCalendarEvent,
	IconCheck,
	IconFileDescription,
	IconSettings,
	IconStar,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { ASSESSMENT_TYPES } from '@/app/academic/assessments/_lib/utils';
import RichTextField from '@/shared/ui/adease/RichTextField';
import { updateAssignment } from '../../_server/actions';
import type { MoodleAssignment } from '../../types';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};

type EditFormValues = {
	assessmentType: string;
	description: string;
	instructions: string;
	allowsubmissionsfromdate: Date | null;
	duedate: Date | null;
	grademax: number;
	visible: boolean;
};

export default function AssignmentEditForm({ assignment, courseId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'general',
	});

	const initialType =
		ASSESSMENT_TYPES.find((t) => t.label === assignment.name)?.value || '';

	const form = useForm<EditFormValues>({
		initialValues: {
			assessmentType: initialType,
			description: assignment.intro || '',
			instructions: '',
			allowsubmissionsfromdate: assignment.allowsubmissionsfromdate
				? new Date(assignment.allowsubmissionsfromdate * 1000)
				: null,
			duedate: assignment.duedate
				? new Date(assignment.duedate * 1000)
				: null,
			grademax: assignment.grade > 0 ? assignment.grade : 100,
			visible: assignment.visible !== 0,
		},
		validate: {
			assessmentType: (v) => (!v ? 'Assignment type is required' : null),
			grademax: (v) => (v < 1 ? 'Grade must be at least 1' : null),
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (values: EditFormValues) => {
			const name =
				ASSESSMENT_TYPES.find((t) => t.value === values.assessmentType)
					?.label || assignment.name;

			await updateAssignment(assignment.id, {
				name,
				intro: values.description,
				activity: values.instructions || undefined,
				allowsubmissionsfromdate: values.allowsubmissionsfromdate
					? Math.floor(values.allowsubmissionsfromdate.getTime() / 1000)
					: undefined,
				duedate: values.duedate
					? Math.floor(values.duedate.getTime() / 1000)
					: undefined,
				grademax: values.grademax,
				visible: values.visible ? 1 : 0,
			});
		},
		onSuccess: () => {
			notifications.show({
				message: 'Assignment updated successfully',
				color: 'green',
				icon: <IconCheck size={16} />,
			});
			queryClient.invalidateQueries({
				queryKey: ['course-assignments', courseId],
			});
			router.push(`/lms/courses/${courseId}/assignments/${assignment.id}`);
		},
		onError: (error) => {
			notifications.show({
				message: error.message || 'Failed to update assignment',
				color: 'red',
			});
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		updateMutation.mutate(values);
	});

	return (
		<form onSubmit={handleSubmit}>
			<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
				<Tabs.List>
					<Tabs.Tab
						value='general'
						leftSection={<IconFileDescription size={16} />}
					>
						General
					</Tabs.Tab>
					<Tabs.Tab value='settings' leftSection={<IconSettings size={16} />}>
						Settings
					</Tabs.Tab>

					<Box ml='auto' mt={-5}>
						<Group gap='xs'>
							<Button
								variant='default'
								size='xs'
								onClick={() =>
									router.push(
										`/lms/courses/${courseId}/assignments/${assignment.id}`
									)
								}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								size='xs'
								loading={updateMutation.isPending}
								disabled={!form.isDirty()}
							>
								Save Changes
							</Button>
						</Group>
					</Box>
				</Tabs.List>

				<Tabs.Panel value='general' pt='lg'>
					<Grid gutter='lg'>
						<Grid.Col span={{ base: 12, md: 8 }}>
							<Stack gap='lg'>
								<Select
									label='Assignment Type'
									placeholder='Select assignment type'
									searchable
									data={ASSESSMENT_TYPES}
									{...form.getInputProps('assessmentType')}
								/>

								<Tabs defaultValue='description'>
									<Tabs.List>
										<Tabs.Tab value='description'>Description</Tabs.Tab>
										<Tabs.Tab value='instructions'>Instructions</Tabs.Tab>
									</Tabs.List>

									<Tabs.Panel value='description'>
										<RichTextField
											showFullScreenButton={false}
											height={320}
											toolbar='full'
											{...form.getInputProps('description')}
										/>
									</Tabs.Panel>

									<Tabs.Panel value='instructions'>
										<RichTextField
											showFullScreenButton={false}
											height={320}
											{...form.getInputProps('instructions')}
										/>
									</Tabs.Panel>
								</Tabs>

								<Switch
									label='Visible to students'
									{...form.getInputProps('visible', { type: 'checkbox' })}
								/>
							</Stack>
						</Grid.Col>

						<Grid.Col span={{ base: 12, md: 4 }}>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconStar size={14} />
										</ThemeIcon>
										<Title order={5}>Summary</Title>
									</Group>
									<Divider />

									<Stack gap='sm'>
										<Group justify='space-between'>
											<Text size='sm' c='dimmed'>
												Maximum Grade
											</Text>
											<Text fw={600}>
												{form.values.grademax}
											</Text>
										</Group>

										<Group justify='space-between'>
											<Text size='sm' c='dimmed'>
												Visibility
											</Text>
											<Text fw={500} size='sm' c={form.values.visible ? 'green' : 'orange'}>
												{form.values.visible ? 'Visible' : 'Hidden'}
											</Text>
										</Group>

										<Group justify='space-between'>
											<Text size='sm' c='dimmed'>
												Due Date
											</Text>
											<Text size='sm'>
												{form.values.duedate
													? form.values.duedate.toLocaleDateString()
													: 'Not set'}
											</Text>
										</Group>
									</Stack>
								</Stack>
							</Paper>
						</Grid.Col>
					</Grid>
				</Tabs.Panel>

				<Tabs.Panel value='settings' pt='lg'>
					<Grid gutter='lg'>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconCalendarEvent size={14} />
										</ThemeIcon>
										<Title order={5}>Timing</Title>
									</Group>
									<Divider />

									<DateTimePicker
										label='Available From'
										placeholder='Select when submissions open'
										clearable
										{...form.getInputProps('allowsubmissionsfromdate')}
									/>

									<DateTimePicker
										label='Due Date'
										placeholder='Select due date'
										clearable
										{...form.getInputProps('duedate')}
									/>
								</Stack>
							</Paper>
						</Grid.Col>

						<Grid.Col span={{ base: 12, md: 6 }}>
							<Paper p='lg' withBorder>
								<Stack gap='md'>
									<Group gap='xs'>
										<ThemeIcon size='sm' variant='light' color='gray'>
											<IconStar size={14} />
										</ThemeIcon>
										<Title order={5}>Grading</Title>
									</Group>
									<Divider />

									<NumberInput
										label='Maximum Grade'
										placeholder='100'
										min={1}
										{...form.getInputProps('grademax')}
									/>
								</Stack>
							</Paper>
						</Grid.Col>
					</Grid>
				</Tabs.Panel>
			</Tabs>
		</form>
	);
}
