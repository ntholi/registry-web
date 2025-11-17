'use client';

import type { searchModulesWithDetails } from '@academic/semester-modules';
import {
	Button,
	Checkbox,
	Grid,
	Group,
	Modal,
	MultiSelect,
	NumberInput,
	Select,
	Slider,
	Stack,
	Tabs,
	Text,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import DurationInput from '@/shared/ui/DurationInput';
import {
	createLecturerAllocationsWithVenueTypes,
	createLecturerAllocationWithVenueTypes,
} from '../server/actions';
import { ModuleSearchInput } from './ModuleSearchInput';

const daysOfWeek = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
] as const;

const schema = z.object({
	semesterModuleId: z.number().min(1, 'Please select a semester module'),
	duration: z.number().min(1, 'Please enter a valid duration'),
	numberOfStudents: z.number().min(0),
	venueTypeIds: z.array(z.number()),
	numberOfGroups: z.number().min(0).max(10),
	groups: z.array(z.string()),
	allowedDays: z
		.array(z.enum(daysOfWeek))
		.min(1, 'Please select at least one day'),
	startTime: z.string().min(1, 'Please enter a start time'),
	endTime: z.string().min(1, 'Please enter an end time'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	userId: string;
	termId: number;
};

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

export default function AddAllocationModal({ userId, termId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);

	const { data: venueTypes = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
	});

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			semesterModuleId: 0,
			duration: 30,
			numberOfStudents: 0,
			venueTypeIds: [],
			numberOfGroups: 0,
			groups: [],
			allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
			startTime: '08:30:00',
			endTime: '17:30:00',
		},
	});

	function generateGroupNames(count: number): string[] {
		if (count === 0) return [];
		const letters = 'ABCDEFGHIJ'.split('');
		return letters.slice(0, count);
	}

	function handleGroupCountChange(value: number) {
		form.setFieldValue('numberOfGroups', value);
		form.setFieldValue('groups', generateGroupNames(value));
	}

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (values.groups.length === 0) {
				return createLecturerAllocationWithVenueTypes(
					{
						userId,
						termId,
						semesterModuleId: values.semesterModuleId,
						duration: values.duration,
						numberOfStudents: values.numberOfStudents,
						allowedDays: values.allowedDays,
						startTime: values.startTime,
						endTime: values.endTime,
					},
					values.venueTypeIds
				);
			}

			const allocations = values.groups.map((groupName) => ({
				userId,
				termId,
				semesterModuleId: values.semesterModuleId,
				duration: values.duration,
				numberOfStudents: Math.floor(
					values.numberOfStudents / values.groups.length
				),
				groupName,
				allowedDays: values.allowedDays,
				startTime: values.startTime,
				endTime: values.endTime,
			}));

			return createLecturerAllocationsWithVenueTypes(
				allocations,
				values.venueTypeIds
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['lecturer-allocations'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Allocation added successfully',
				color: 'green',
			});
			form.reset();
			setSelectedModule(null);
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to add allocation',
				color: 'red',
			});
		},
	});

	const handleSubmit = (values: FormValues) => {
		mutation.mutate(values);
	};

	const handleOpen = () => {
		form.reset();
		setSelectedModule(null);
		open();
	};

	const handleModuleSelect = (module: Module | null) => {
		setSelectedModule(module);
		if (module && module.semesters.length > 0) {
			form.setFieldValue('semesterModuleId', 0);
		}
	};

	const semesterOptions =
		selectedModule?.semesters.map((semester) => ({
			value: semester.semesterModuleId.toString(),
			label: `${semester.programName} - ${semester.semesterName} (${semester.studentCount} Students)`,
		})) || [];

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconPlus size={16} />}
				onClick={handleOpen}
			>
				Add
			</Button>

			<Modal opened={opened} onClose={close} title='Add Allocation' size='lg'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='constraints'>Constraints</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Stack gap='md'>
								<ModuleSearchInput
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
									onChange={(value) => {
										form.setFieldValue(
											'semesterModuleId',
											value ? Number(value) : 0
										);
									}}
									error={form.errors.semesterModuleId}
									disabled={!selectedModule || semesterOptions.length === 0}
									searchable
									required
								/>
								<Grid align='end'>
									<Grid.Col span={6}>
										<DurationInput
											label='Duration'
											value={form.values.duration}
											onChange={(value) =>
												form.setFieldValue('duration', value)
											}
											error={form.errors.duration}
											required
										/>
									</Grid.Col>
									<Grid.Col span={6}>
										<NumberInput
											label='Number of Students'
											placeholder='Enter number of students'
											value={form.values.numberOfStudents}
											onChange={(value) =>
												form.setFieldValue('numberOfStudents', value as number)
											}
											error={form.errors.numberOfStudents}
											min={0}
											required
										/>
									</Grid.Col>
								</Grid>
								<Stack gap='xs'>
									<Text size='sm' fw={500}>
										Number of Groups
									</Text>
									<Slider
										value={form.values.numberOfGroups}
										onChange={handleGroupCountChange}
										min={0}
										max={10}
										step={1}
										marks={[
											{ value: 0, label: '0' },
											{ value: 1, label: '1' },
											{ value: 2, label: '2' },
											{ value: 3, label: '3' },
											{ value: 4, label: '4' },
											{ value: 5, label: '5' },
											{ value: 6, label: '6' },
											{ value: 7, label: '7' },
											{ value: 8, label: '8' },
											{ value: 9, label: '9' },
											{ value: 10, label: '10' },
										]}
										label={(value) =>
											value === 0
												? 'All Students'
												: `${value} Group${value === 1 ? '' : 's'}`
										}
									/>
									<Text size='xs' c='dimmed' mt='md'>
										{form.values.numberOfGroups === 0
											? 'Assign the entire class to this lecturer'
											: `Split the class into ${form.values.numberOfGroups} group${form.values.numberOfGroups === 1 ? '' : 's'}`}
									</Text>
								</Stack>
								<MultiSelect
									label='Venue Types'
									placeholder='Select venue types (optional)'
									data={venueTypes.map((vt: { id: number; name: string }) => ({
										value: vt.id.toString(),
										label: vt.name,
									}))}
									value={form.values.venueTypeIds.map((id) => id.toString())}
									onChange={(values) => {
										form.setFieldValue(
											'venueTypeIds',
											values.map((v) => Number(v))
										);
									}}
									searchable
									clearable
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='constraints' pt='md'>
							<Stack gap='md'>
								<Checkbox.Group
									label='Allowed Days'
									description='Select which days of the week this allocation can be scheduled'
									value={form.values.allowedDays}
									onChange={(value) =>
										form.setFieldValue(
											'allowedDays',
											value as unknown as (typeof daysOfWeek)[number][]
										)
									}
									error={form.errors.allowedDays}
									required
								>
									<Stack mt='xs' gap='xs'>
										<Checkbox value='monday' label='Monday' />
										<Checkbox value='tuesday' label='Tuesday' />
										<Checkbox value='wednesday' label='Wednesday' />
										<Checkbox value='thursday' label='Thursday' />
										<Checkbox value='friday' label='Friday' />
										<Checkbox value='saturday' label='Saturday' />
										<Checkbox value='sunday' label='Sunday' />
									</Stack>
								</Checkbox.Group>

								<TimeInput
									label='Start Time'
									description='Earliest time this allocation can be scheduled'
									value={form.values.startTime}
									onChange={(event) =>
										form.setFieldValue('startTime', event.currentTarget.value)
									}
									error={form.errors.startTime}
									required
								/>

								<TimeInput
									label='End Time'
									description='Latest time this allocation can be scheduled'
									value={form.values.endTime}
									onChange={(event) =>
										form.setFieldValue('endTime', event.currentTarget.value)
									}
									error={form.errors.endTime}
									required
								/>
							</Stack>
						</Tabs.Panel>
					</Tabs>

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
		</>
	);
}
