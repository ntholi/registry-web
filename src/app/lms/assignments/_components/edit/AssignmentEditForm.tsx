'use client';

import {
	ActionIcon,
	Box,
	Button,
	Divider,
	FileButton,
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
	IconPaperclip,
	IconSettings,
	IconStar,
	IconTrash,
	IconUpload,
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
	name: string;
	description: string;
	instructions: string;
	allowsubmissionsfromdate: Date | null;
	duedate: Date | null;
	grademax: number;
	visible: boolean;
	attachments: File[];
};

export default function AssignmentEditForm({ assignment, courseId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'general',
	});

	const assignmentType = ASSESSMENT_TYPES.find(
		(t) => t.label === assignment.name
	)?.value;

	const form = useForm<EditFormValues>({
		initialValues: {
			name: assignmentType || assignment.name || '',
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
			attachments: [],
		},
		validate: {
			name: (v) => (!v?.trim() ? 'Assignment type is required' : null),
			grademax: (v) => (v < 1 ? 'Grade must be at least 1' : null),
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (values: EditFormValues) => {
			const typeLabel =
				ASSESSMENT_TYPES.find((t) => t.value === values.name)?.label ||
				values.name;

			await updateAssignment(assignment.id, {
				name: typeLabel,
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

	function handleFilesSelect(files: File[]) {
		form.setFieldValue('attachments', [
			...form.values.attachments,
			...files,
		]);
	}

	function handleFileRemove(index: number) {
		form.setFieldValue(
			'attachments',
			form.values.attachments.filter((_, i) => i !== index)
		);
	}

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
					<Stack gap='lg'>
						<Grid gutter='lg'>
							<Grid.Col span={{ base: 12, md: 6 }}>
								<Paper p='lg' withBorder h='100%'>
									<Stack gap='md'>
										<Title order={5}>Assignment Information</Title>
										<Divider />
										<Select
											label='Assignment Type'
											placeholder='Select assignment type'
											searchable
											data={ASSESSMENT_TYPES}
											{...form.getInputProps('name')}
										/>
										<NumberInput
											label='Marks'
											placeholder='100'
											min={1}
											{...form.getInputProps('grademax')}
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
								<Paper p='lg' withBorder h='100%'>
									<Stack gap='md'>
										<Group gap='xs' justify='space-between'>
											<Group gap='xs'>
												<ThemeIcon size='sm' variant='light' color='gray'>
													<IconPaperclip size={14} />
												</ThemeIcon>
												<Title order={5}>Files</Title>
											</Group>
											<FileButton onChange={handleFilesSelect} multiple>
												{(props) => (
													<Button
														variant='light'
														size='xs'
														leftSection={<IconUpload size={14} />}
														{...props}
													>
														Upload
													</Button>
												)}
											</FileButton>
										</Group>
										<Divider />
										{form.values.attachments.length === 0 ? (
											<Text size='sm' c='dimmed' ta='center' py='md'>
												No files attached
											</Text>
										) : (
											<Stack gap='xs'>
												{form.values.attachments.map((file, index) => (
													<Paper
														key={`${file.name}-${index}`}
														withBorder
														p='xs'
													>
														<Group
															justify='space-between'
															wrap='nowrap'
														>
															<Group
																gap='xs'
																style={{ flex: 1, minWidth: 0 }}
															>
																<IconPaperclip size={14} />
																<Text
																	size='sm'
																	truncate
																	style={{ flex: 1 }}
																>
																	{file.name}
																</Text>
																<Text size='xs' c='dimmed'>
																	{(file.size / 1024).toFixed(1)} KB
																</Text>
															</Group>
															<ActionIcon
																variant='subtle'
																color='red'
																size='sm'
																onClick={() => handleFileRemove(index)}
															>
																<IconTrash size={14} />
															</ActionIcon>
														</Group>
													</Paper>
												))}
											</Stack>
										)}
									</Stack>
								</Paper>
							</Grid.Col>
						</Grid>

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
					</Stack>
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
							<Stack gap='lg'>
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

								<Paper p='lg' withBorder>
									<Stack gap='md'>
										<Title order={5}>Visibility</Title>
										<Divider />
										<Switch
											label='Visible to students'
											{...form.getInputProps('visible', {
												type: 'checkbox',
											})}
										/>
									</Stack>
								</Paper>
							</Stack>
						</Grid.Col>
					</Grid>
				</Tabs.Panel>
			</Tabs>
		</form>
	);
}
