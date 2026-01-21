'use client';

import { searchAllLecturers } from '@academic/lecturers';
import {
	getStudentCountForModule,
	type searchModulesWithDetails,
} from '@academic/semester-modules';
import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Grid,
	Group,
	Loader,
	Modal,
	NumberInput,
	Paper,
	SegmentedControl,
	Select,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconListDetails, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAllocationsWithSlots } from '@timetable/slots';
import { ModuleSearchInput } from '@timetable/timetable-allocations';
import { getAllVenues } from '@timetable/venues';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { getAllTerms } from '@/app/registry/terms';
import { calculateDuration } from '@/shared/lib/utils/dates';
import { toClassName as toClassNameShared } from '@/shared/lib/utils/utils';
import {
	type DayOfWeek,
	type GroupSlot,
	groupSlotSchema,
} from '../_lib/schemas';
import { getTimetableAllocationsByUserId } from '../_server/actions';
import AllocationTable from './AllocationTable';

const daysOfWeekOptions = [
	{ value: 'monday', label: 'Mon' },
	{ value: 'tuesday', label: 'Tue' },
	{ value: 'wednesday', label: 'Wed' },
	{ value: 'thursday', label: 'Thu' },
	{ value: 'friday', label: 'Fri' },
	{ value: 'saturday', label: 'Sat' },
	{ value: 'sunday', label: 'Sun' },
];

const schema = z.object({
	userId: z.string().min(1, 'Please select a lecturer'),
	termId: z.number().min(1, 'Please select a term'),
	semesterModuleId: z.number().min(1, 'Please select a semester module'),
	numberOfStudents: z.number().min(1, 'A class should have at least 1 student'),
	numberOfGroups: z.number().min(1, 'Must have at least 1 group'),
	groupSlots: z.array(groupSlotSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

type SemesterOption = {
	value: string;
	label: string;
	description: string;
	searchValue: string;
};

function createDefaultGroupSlot(): GroupSlot {
	return {
		dayOfWeek: 'monday',
		startTime: '08:30',
		endTime: '10:30',
		venueId: '',
	};
}

export default function AddSlotAllocationWithLecturerModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);
	const [lecturerSearch, setLecturerSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(lecturerSearch, 300);
	const [activeTab, setActiveTab] = useState<string | null>('form');

	const { data: lecturerOptions = [], isLoading: lecturersLoading } = useQuery({
		queryKey: ['lecturers-search', debouncedSearch],
		queryFn: () => searchAllLecturers(debouncedSearch),
		enabled: debouncedSearch.length >= 2,
	});

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const { data: venues = [] } = useQuery({
		queryKey: ['venues'],
		queryFn: getAllVenues,
	});

	const latestTerm = terms[0];

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			userId: '',
			termId: latestTerm?.id ?? 0,
			semesterModuleId: 0,
			numberOfStudents: 0,
			numberOfGroups: 1,
			groupSlots: [createDefaultGroupSlot()],
		},
	});

	const handleGroupsChange = (value: number | string) => {
		const newCount = typeof value === 'number' ? value : 1;
		form.setFieldValue('numberOfGroups', newCount);

		const currentSlots = form.values.groupSlots;
		if (newCount > currentSlots.length) {
			const newSlots = [
				...currentSlots,
				...Array.from({ length: newCount - currentSlots.length }, () =>
					createDefaultGroupSlot()
				),
			];
			form.setFieldValue('groupSlots', newSlots);
		} else if (newCount < currentSlots.length) {
			form.setFieldValue('groupSlots', currentSlots.slice(0, newCount));
		}
	};

	const selectedUserId = form.values.userId;
	const selectedTermId = form.values.termId;

	const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
		queryKey: ['timetable-allocations', selectedUserId],
		queryFn: () => getTimetableAllocationsByUserId(selectedUserId),
		enabled: !!selectedUserId,
	});

	const filteredAllocations = allocations.filter(
		(a) => a.termId === selectedTermId
	);

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const groups =
				values.numberOfGroups === 1
					? [null]
					: Array.from({ length: values.numberOfGroups }, (_, i) =>
							String.fromCharCode(65 + i)
						);

			const studentsPerGroup = Math.floor(
				values.numberOfStudents / groups.length
			);

			const items = groups.map((groupName, index) => {
				const slot = values.groupSlots[index];
				const calculatedDuration = calculateDuration(
					slot.startTime,
					slot.endTime
				);

				return {
					allocation: {
						userId: values.userId,
						termId: values.termId,
						semesterModuleId: values.semesterModuleId,
						duration: calculatedDuration,
						classType: 'lecture' as const,
						numberOfStudents: studentsPerGroup,
						groupName,
						allowedDays: [slot.dayOfWeek],
						startTime: `${slot.startTime}:00`,
						endTime: `${slot.endTime}:00`,
					},
					slot: {
						venueId: slot.venueId,
						dayOfWeek: slot.dayOfWeek,
						startTime: `${slot.startTime}:00`,
						endTime: `${slot.endTime}:00`,
					},
				};
			});

			return createAllocationsWithSlots(items);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['timetable-allocations'],
				refetchType: 'all',
			});
			await queryClient.invalidateQueries({
				queryKey: ['timetable-slots'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Allocation created and scheduled successfully',
				color: 'green',
			});
			form.reset();
			setSelectedModule(null);
			setLecturerSearch('');
			close();
		},
		onError: (error: Error) => {
			let message = error.message || 'Failed to create allocation';
			let title = 'Error';

			const lowerMsg = message.toLowerCase();
			if (
				lowerMsg.includes('not available') ||
				lowerMsg.includes('booked') ||
				lowerMsg.includes('time slot')
			) {
				title = 'Venue/Time Conflict';
			} else if (
				lowerMsg.includes('already') ||
				lowerMsg.includes('duplicate') ||
				lowerMsg.includes('exists')
			) {
				title = 'Duplicate Allocation';
			} else if (
				lowerMsg.includes('failed query') ||
				lowerMsg.includes('insert into')
			) {
				message =
					'Unable to save the allocation. The venue might already be booked for this time. Please choose a different time or venue.';
				title = 'Save Failed';
			}

			notifications.show({
				title,
				message,
				color: 'red',
				autoClose: 8000,
			});
		},
	});

	const handleSubmit = (values: FormValues) => {
		mutation.mutate(values);
	};

	const handleOpen = () => {
		form.reset();
		if (latestTerm) {
			form.setFieldValue('termId', latestTerm.id);
		}
		form.setFieldValue('groupSlots', [createDefaultGroupSlot()]);
		setSelectedModule(null);
		setLecturerSearch('');
		setActiveTab('form');
		open();
	};

	const handleModuleSelect = (module: Module | null) => {
		setSelectedModule(module);
		if (module && module.semesters.length > 0) {
			form.setFieldValue('semesterModuleId', 0);
		}
	};

	const handleSemesterModuleChange = useCallback(
		(value: string | null) => {
			const val = value ? Number(value) : 0;
			form.setFieldValue('semesterModuleId', val);
			if (val && selectedModule) {
				const semester = selectedModule.semesters.find(
					(s) => s.semesterModuleId === val
				);
				if (semester) {
					getStudentCountForModule(val).then((count) => {
						form.setFieldValue('numberOfStudents', count);
					});
				}
			} else {
				form.setFieldValue('numberOfStudents', 0);
			}
		},
		[form, selectedModule]
	);

	const semesterOptions =
		selectedModule?.semesters.map((semester) => {
			const name = toClassNameShared(
				semester.programCode,
				semester.semesterName
			);
			return {
				value: semester.semesterModuleId.toString(),
				label: name,
				description: semester.programName,
				searchValue: `${name} ${semester.programName}`,
			};
		}) || [];

	const termOptions = terms.map((t) => ({
		value: t.id.toString(),
		label: `${t.code}${t.isActive ? ' (Current)' : ''}`,
	}));

	return (
		<>
			<ActionIcon variant='subtle' color='gray' size='lg' onClick={handleOpen}>
				<IconPlus size={'1rem'} />
			</ActionIcon>

			<Modal
				opened={opened}
				onClose={close}
				title='Add Allocation to Slot'
				size='60vw'
			>
				<Stack gap='xl'>
					<Alert color='red' variant='light' title='Proceed with Caution'>
						<Text size='sm'>
							This is not the recommended way to add timetable slots and might
							cause inconsistencies or cause conflicts in the timetable
						</Text>
					</Alert>

					<Group grow>
						<Select
							label='Lecturer'
							placeholder='Type to search lecturers...'
							data={lecturerOptions}
							value={form.values.userId || null}
							onChange={(value) => form.setFieldValue('userId', value ?? '')}
							onSearchChange={setLecturerSearch}
							searchValue={lecturerSearch}
							error={form.errors.userId}
							searchable
							nothingFoundMessage={
								lecturerSearch.length < 2
									? 'Type at least 2 characters to search'
									: lecturersLoading
										? 'Searching...'
										: 'No lecturers found'
							}
							required
						/>

						<Select
							label='Term'
							placeholder='Select a term'
							data={termOptions}
							value={form.values.termId ? form.values.termId.toString() : null}
							onChange={(value) =>
								form.setFieldValue('termId', value ? Number(value) : 0)
							}
							error={form.errors.termId}
							searchable
							required
						/>
					</Group>

					{selectedUserId && (
						<Tabs value={activeTab} onChange={setActiveTab}>
							<Tabs.List>
								<Tabs.Tab value='form' leftSection={<IconPlus size='0.9rem' />}>
									New Allocation
								</Tabs.Tab>
								<Tabs.Tab
									value='allocations'
									leftSection={<IconListDetails size='0.9rem' />}
								>
									Current Allocations
									{filteredAllocations.length > 0 && (
										<Badge size='xs' ml='xs' variant='light'>
											{filteredAllocations.length}
										</Badge>
									)}
								</Tabs.Tab>
							</Tabs.List>

							<Tabs.Panel value='form' pt='md'>
								<form onSubmit={form.onSubmit(handleSubmit)}>
									<Stack gap='md'>
										<SimpleGrid cols={{ base: 1, sm: 2 }}>
											<ModuleSearchInput
												label='Module'
												onModuleSelect={handleModuleSelect}
												required
											/>

											<Select
												label='Class'
												placeholder='Select a Student Class'
												data={semesterOptions}
												value={
													form.values.semesterModuleId
														? form.values.semesterModuleId.toString()
														: null
												}
												onChange={handleSemesterModuleChange}
												error={form.errors.semesterModuleId}
												disabled={
													!selectedModule || semesterOptions.length === 0
												}
												searchable
												required
												renderOption={({ option }) => {
													const semesterOption = option as SemesterOption;
													return (
														<Stack gap={0}>
															<Text size='sm'>{semesterOption.label}</Text>
															<Text size='xs' c='dimmed'>
																{semesterOption.description}
															</Text>
														</Stack>
													);
												}}
											/>
										</SimpleGrid>

										<Grid>
											<Grid.Col span={6}>
												<NumberInput
													label='Number of Students'
													placeholder='Students'
													value={form.values.numberOfStudents}
													onChange={(value) =>
														form.setFieldValue(
															'numberOfStudents',
															typeof value === 'number' ? value : 0
														)
													}
													error={form.errors.numberOfStudents}
													min={1}
													required
												/>
											</Grid.Col>
											<Grid.Col span={6}>
												<NumberInput
													label='Number of Groups'
													placeholder='Groups'
													value={form.values.numberOfGroups}
													onChange={handleGroupsChange}
													error={form.errors.numberOfGroups}
													min={1}
													max={10}
													required
												/>
											</Grid.Col>
										</Grid>

										<SimpleGrid
											cols={{
												base: 1,
												md: form.values.groupSlots.length > 1 ? 2 : 1,
											}}
											spacing='md'
										>
											{form.values.groupSlots.map((slot, index) => {
												const groupLabel =
													form.values.numberOfGroups === 1
														? ''
														: `Group ${String.fromCharCode(65 + index)}`;
												const duration = calculateDuration(
													slot.startTime,
													slot.endTime
												);

												return (
													<Paper key={index} withBorder p='md'>
														<Stack gap='sm'>
															<Title order={6}>{groupLabel}</Title>

															<Stack gap='xs'>
																<SegmentedControl
																	fullWidth
																	size='xs'
																	data={daysOfWeekOptions}
																	value={slot.dayOfWeek}
																	onChange={(value) =>
																		form.setFieldValue(
																			`groupSlots.${index}.dayOfWeek`,
																			value as DayOfWeek
																		)
																	}
																/>
															</Stack>

															<Grid>
																<Grid.Col span={4}>
																	<TimeInput
																		label='Start'
																		value={slot.startTime}
																		onChange={(e) =>
																			form.setFieldValue(
																				`groupSlots.${index}.startTime`,
																				e.currentTarget.value
																			)
																		}
																		error={
																			form.errors[
																				`groupSlots.${index}.startTime`
																			]
																		}
																		required
																	/>
																</Grid.Col>
																<Grid.Col span={4}>
																	<TimeInput
																		label='End'
																		value={slot.endTime}
																		onChange={(e) =>
																			form.setFieldValue(
																				`groupSlots.${index}.endTime`,
																				e.currentTarget.value
																			)
																		}
																		error={
																			form.errors[`groupSlots.${index}.endTime`]
																		}
																		required
																	/>
																</Grid.Col>
																<Grid.Col span={4}>
																	<Select
																		label='Venue'
																		placeholder='Select venue'
																		data={venues.map((v) => ({
																			value: v.id,
																			label: v.name,
																		}))}
																		value={slot.venueId || null}
																		onChange={(value) =>
																			form.setFieldValue(
																				`groupSlots.${index}.venueId`,
																				value ?? ''
																			)
																		}
																		error={
																			form.errors[`groupSlots.${index}.venueId`]
																		}
																		searchable
																		required
																	/>
																</Grid.Col>
															</Grid>

															{duration > 0 && (
																<Text size='xs' c='dimmed'>
																	Duration: {Math.floor(duration / 60)}h{' '}
																	{duration % 60}m
																</Text>
															)}
														</Stack>
													</Paper>
												);
											})}
										</SimpleGrid>
									</Stack>

									<Group justify='flex-end' mt='md'>
										<Button variant='subtle' onClick={close}>
											Cancel
										</Button>
										<Button type='submit' loading={mutation.isPending}>
											Add Allocation
										</Button>
									</Group>
								</form>
							</Tabs.Panel>

							<Tabs.Panel value='allocations' pt='md'>
								{allocationsLoading ? (
									<Box py='xl'>
										<Loader size='sm' />
									</Box>
								) : (
									<AllocationTable
										allocations={filteredAllocations}
										userId={selectedUserId}
										showEdit={false}
										emptyMessage='No allocations found for this lecturer in the selected term.'
									/>
								)}
							</Tabs.Panel>
						</Tabs>
					)}

					{!selectedUserId && (
						<Text size='sm' c='dimmed' ta='center' py='xl'>
							Select a lecturer to view or add allocations.
						</Text>
					)}
				</Stack>
			</Modal>
		</>
	);
}
