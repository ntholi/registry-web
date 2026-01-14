'use client';

import {
	getStudentCountForModule,
	type searchModulesWithDetails,
} from '@academic/semester-modules';
import {
	Button,
	Grid,
	Group,
	Modal,
	NumberInput,
	SegmentedControl,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAllocationWithSlot } from '@timetable/slots';
import { ModuleSearchInput } from '@timetable/timetable-allocations';
import { getAllVenues } from '@timetable/venues';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { toClassName as toClassNameShared } from '@/shared/lib/utils/utils';
import DurationInput from '@/shared/ui/DurationInput';
import { addMinutesToTime } from '../../_lib/utils';

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

const schema = z.object({
	semesterModuleId: z.number().min(1, 'Please select a semester module'),
	duration: z.number().min(1, 'Please enter a valid duration'),
	numberOfStudents: z.number().min(1, 'A class should have at least 1 student'),
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
	venueId: z.string().min(1, 'Please select a venue'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	userId: string;
	termId: number;
	defaultDuration?: number;
};

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

type SemesterOption = {
	value: string;
	label: string;
	description: string;
	searchValue: string;
};

export default function AddSlotAllocationModal({
	userId,
	termId,
	defaultDuration = 120,
}: Props) {
	const [opened, { close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);
	const [className, setClassName] = useState<string>('');

	const { data: venues = [] } = useQuery({
		queryKey: ['venues'],
		queryFn: getAllVenues,
	});

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			semesterModuleId: 0,
			duration: defaultDuration,
			numberOfStudents: 0,
			numberOfGroups: 1,
			dayOfWeek: 'monday' as DayOfWeek,
			startTime: '08:30',
			venueId: '',
		},
	});

	const endTime = addMinutesToTime(
		form.values.startTime || '08:30',
		form.values.duration
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

			const results = [];
			for (const groupName of groups) {
				const result = await createAllocationWithSlot(
					{
						userId,
						termId,
						semesterModuleId: values.semesterModuleId,
						duration: values.duration,
						classType: 'lecture',
						numberOfStudents: studentsPerGroup,
						groupName,
						allowedDays: [values.dayOfWeek],
						startTime: `${values.startTime}:00`,
						endTime: endTime,
					},
					{
						venueId: values.venueId,
						dayOfWeek: values.dayOfWeek,
						startTime: `${values.startTime}:00`,
						endTime: endTime,
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

	return (
		<Modal
			opened={opened}
			onClose={close}
			title='Add Allocation to Slot'
			size='lg'
		>
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

					<DurationInput
						label='Duration'
						value={form.values.duration}
						onChange={(value) => form.setFieldValue('duration', value)}
						error={form.errors.duration}
						required
					/>

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
								description='24hr format'
								placeholder='HH:mm'
								value={form.values.startTime}
								onChange={(e) =>
									form.setFieldValue('startTime', e.currentTarget.value)
								}
								error={form.errors.startTime}
								required
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<TimeInput
								label='End Time'
								description='24hr format'
								placeholder='HH:mm'
								value={endTime}
								disabled
							/>
						</Grid.Col>
					</Grid>

					<Select
						label='Venue'
						placeholder='Select a venue'
						data={venues.map((v) => ({
							value: v.id,
							label: v.name,
						}))}
						value={form.values.venueId || null}
						onChange={(value) => form.setFieldValue('venueId', value ?? '')}
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
		</Modal>
	);
}
