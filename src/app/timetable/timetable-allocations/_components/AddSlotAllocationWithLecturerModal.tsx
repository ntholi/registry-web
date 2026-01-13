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
	SegmentedControl,
	Select,
	Stack,
	Tabs,
	Text,
	Tooltip,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconAlertTriangle,
	IconListDetails,
	IconPlus,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAllocationWithSlot } from '@timetable/slots';
import { ModuleSearchInput } from '@timetable/timetable-allocations';
import { getAllVenues } from '@timetable/venues';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { getAllTerms } from '@/app/registry/terms';
import { toClassName as toClassNameShared } from '@/shared/lib/utils/utils';
import { calculateDuration } from '../../_lib/utils';
import { getTimetableAllocationsByUserId } from '../_server/actions';
import AllocationTable from './AllocationTable';

const daysOfWeek = [
	{ value: 'monday', label: 'Mon' },
	{ value: 'tuesday', label: 'Tue' },
	{ value: 'wednesday', label: 'Wed' },
	{ value: 'thursday', label: 'Thu' },
	{ value: 'friday', label: 'Fri' },
	{ value: 'saturday', label: 'Sat' },
	{ value: 'sunday', label: 'Sun' },
];

type DayOfWeek =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

const schema = z
	.object({
		userId: z.string().min(1, 'Please select a lecturer'),
		termId: z.number().min(1, 'Please select a term'),
		semesterModuleId: z.number().min(1, 'Please select a semester module'),
		numberOfStudents: z
			.number()
			.min(1, 'A class should have at least 1 student'),
		numberOfGroups: z.number().min(1, 'Must have at least 1 group'),
		dayOfWeek: z.enum([
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday',
		]),
		startTime: z.string().min(1, 'Please enter a start time'),
		endTime: z.string().min(1, 'Please enter an end time'),
		venueId: z.number().min(1, 'Please select a venue'),
	})
	.refine(
		(data) => {
			const duration = calculateDuration(data.startTime, data.endTime);
			return duration > 0;
		},
		{
			message: 'End time must be after start time',
			path: ['endTime'],
		}
	);

type FormValues = z.infer<typeof schema>;

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

type SemesterOption = {
	value: string;
	label: string;
	description: string;
	searchValue: string;
};

export default function AddSlotAllocationWithLecturerModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);
	const [className, setClassName] = useState<string>('');
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

	const activeTerm = terms.find((t) => t.isActive);

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			userId: '',
			termId: activeTerm?.id ?? 0,
			semesterModuleId: 0,
			numberOfStudents: 0,
			numberOfGroups: 1,
			dayOfWeek: 'monday' as DayOfWeek,
			startTime: '08:30',
			endTime: '10:30',
			venueId: 0,
		},
	});

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

	const duration = calculateDuration(
		form.values.startTime,
		form.values.endTime
	);

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const calculatedDuration = calculateDuration(
				values.startTime,
				values.endTime
			);
			const groups =
				values.numberOfGroups === 1
					? [null]
					: Array.from({ length: values.numberOfGroups }, (_, i) =>
							String.fromCharCode(65 + i)
						);

			const studentsPerGroup = Math.floor(
				values.numberOfStudents / groups.length
			);

			const results = [];
			for (const groupName of groups) {
				const result = await createAllocationWithSlot(
					{
						userId: values.userId,
						termId: values.termId,
						semesterModuleId: values.semesterModuleId,
						duration: calculatedDuration,
						classType: 'lecture',
						numberOfStudents: studentsPerGroup,
						groupName,
						allowedDays: [values.dayOfWeek],
						startTime: `${values.startTime}:00`,
						endTime: `${values.endTime}:00`,
					},
					{
						venueId: values.venueId,
						dayOfWeek: values.dayOfWeek,
						startTime: `${values.startTime}:00`,
						endTime: `${values.endTime}:00`,
					}
				);
				results.push(result);
			}
			return results;
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
			setClassName('');
			setLecturerSearch('');
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to create allocation',
				color: 'red',
			});
		},
	});

	const handleSubmit = (values: FormValues) => {
		mutation.mutate(values);
	};

	const handleOpen = () => {
		form.reset();
		if (activeTerm) {
			form.setFieldValue('termId', activeTerm.id);
		}
		setSelectedModule(null);
		setClassName('');
		setLecturerSearch('');
		setActiveTab('form');
		open();
	};

	const handleModuleSelect = (module: Module | null) => {
		setSelectedModule(module);
		if (module && module.semesters.length > 0) {
			form.setFieldValue('semesterModuleId', 0);
			setClassName('');
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
					setClassName(
						toClassNameShared(semester.programCode, semester.semesterName)
					);
					getStudentCountForModule(val).then((count) => {
						form.setFieldValue('numberOfStudents', count);
					});
				}
			} else {
				form.setFieldValue('numberOfStudents', 0);
				setClassName('');
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
			<Tooltip label='Add allocation to slot'>
				<ActionIcon
					variant='subtle'
					color='gray'
					size='lg'
					onClick={handleOpen}
				>
					<IconPlus size={'1rem'} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Add Allocation to Slot'
				size='xl'
			>
				<Stack gap='md'>
					<Alert
						icon={<IconAlertTriangle size='1rem' />}
						color='yellow'
						variant='light'
					>
						<Text size='sm'>
							This is not the recommended way to add timetable slots and might
							cause inconsistencies. For a the correct workflow, close this
							modal, search for a lecturer in the search bar, then use the{' '}
							<strong>&quot;Add&quot;</strong> button to add allocations to
							slots.
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
										<ModuleSearchInput
											label='Module'
											onModuleSelect={handleModuleSelect}
											required
										/>

										<Select
											label='Semester Module'
											placeholder='Select a semester module'
											data={semesterOptions}
											value={
												form.values.semesterModuleId
													? form.values.semesterModuleId.toString()
													: null
											}
											onChange={handleSemesterModuleChange}
											error={form.errors.semesterModuleId}
											disabled={!selectedModule || semesterOptions.length === 0}
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

										{className && (
											<Text size='sm' c='dimmed'>
												Class: <strong>{className}</strong>
											</Text>
										)}

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
													onChange={(value) =>
														form.setFieldValue(
															'numberOfGroups',
															typeof value === 'number' ? value : 1
														)
													}
													error={form.errors.numberOfGroups}
													min={1}
													max={10}
													required
												/>
											</Grid.Col>
										</Grid>

										<Stack gap='xs'>
											<Text size='sm' fw={500}>
												Day
											</Text>
											<SegmentedControl
												fullWidth
												data={daysOfWeek}
												value={form.values.dayOfWeek}
												onChange={(value) =>
													form.setFieldValue('dayOfWeek', value as DayOfWeek)
												}
											/>
										</Stack>

										<Grid>
											<Grid.Col span={6}>
												<TimeInput
													label='Start Time'
													value={form.values.startTime}
													onChange={(e) =>
														form.setFieldValue(
															'startTime',
															e.currentTarget.value
														)
													}
													error={form.errors.startTime}
													required
												/>
											</Grid.Col>
											<Grid.Col span={6}>
												<TimeInput
													label='End Time'
													value={form.values.endTime}
													onChange={(e) =>
														form.setFieldValue('endTime', e.currentTarget.value)
													}
													error={form.errors.endTime}
													required
												/>
											</Grid.Col>
										</Grid>

										{duration > 0 && (
											<Text size='xs' c='dimmed'>
												Duration: {Math.floor(duration / 60)}h {duration % 60}m
											</Text>
										)}

										<Select
											label='Venue'
											placeholder='Select a venue'
											data={venues.map((v) => ({
												value: v.id.toString(),
												label: v.name,
											}))}
											value={
												form.values.venueId
													? form.values.venueId.toString()
													: null
											}
											onChange={(value) =>
												form.setFieldValue('venueId', value ? Number(value) : 0)
											}
											error={form.errors.venueId}
											searchable
											required
										/>
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
