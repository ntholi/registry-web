'use client';

import {
	getStudentCountForModule,
	type searchModulesWithDetails,
} from '@academic/semester-modules';
import {
	Button,
	Group,
	Modal,
	Select,
	Slider,
	Stack,
	Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { getAllVenues } from '@timetable/venues';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { toClassName } from '@/shared/lib/utils/utils';
import {
	applyTimeRefinements,
	baseAllocationSchemaInner,
	type DayOfWeek,
} from '../_lib/schemas';
import {
	createTimetableAllocationsWithVenueTypes,
	createTimetableAllocationWithVenueTypes,
} from '../_server/actions';
import { AllocationForm } from './AllocationForm';
import { ModuleSearchInput } from './ModuleSearchInput';

const schema = applyTimeRefinements(
	z
		.object({
			semesterModuleId: z.number().min(1, 'Please select a student class'),
			numberOfGroups: z
				.number()
				.min(1)
				.max(10)
				.refine(
					(val) => val === 1 || val >= 2,
					'Number of groups must be 1 or at least 2'
				),
			groups: z.array(z.string()),
		})
		.merge(baseAllocationSchemaInner)
);

type FormValues = z.infer<typeof schema>;

type Props = {
	userId: string;
	termId: number;
	defaultDuration?: number;
	defaultAllowedDays?: DayOfWeek[];
	defaultStartTime?: string;
	defaultEndTime?: string;
};

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

type SemesterOption = {
	value: string;
	label: string;
	description: string;
	searchValue: string;
};

export default function AddAllocationModal({
	userId,
	termId,
	defaultDuration = 120,
	defaultAllowedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
	defaultStartTime = '08:30:00',
	defaultEndTime = '17:30:00',
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);

	const { data: venueTypes = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
	});

	const { data: venues = [] } = useQuery({
		queryKey: ['venues'],
		queryFn: getAllVenues,
	});

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			semesterModuleId: 0,
			duration: defaultDuration,
			classType: 'lecture',
			numberOfStudents: 0,
			venueTypeIds: [],
			numberOfGroups: 1,
			groups: [],
			allowedDays: defaultAllowedDays,
			startTime: defaultStartTime,
			endTime: defaultEndTime,
			allowedVenueIds: [],
		},
	});

	function generateGroupNames(count: number): string[] {
		if (count <= 1) return [];
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
				return createTimetableAllocationWithVenueTypes(
					{
						userId,
						termId,
						semesterModuleId: values.semesterModuleId,
						duration: values.duration,
						classType: values.classType,
						numberOfStudents: values.numberOfStudents,
						allowedDays: values.allowedDays,
						startTime: values.startTime,
						endTime: values.endTime,
					},
					values.venueTypeIds,
					values.allowedVenueIds
				);
			}

			const allocations = values.groups.map((groupName: string) => ({
				userId,
				termId,
				semesterModuleId: values.semesterModuleId,
				duration: values.duration,
				classType: values.classType,
				numberOfStudents: Math.floor(
					values.numberOfStudents / values.groups.length
				),
				groupName,
				allowedDays: values.allowedDays,
				startTime: values.startTime,
				endTime: values.endTime,
			}));

			return createTimetableAllocationsWithVenueTypes(
				allocations,
				values.venueTypeIds,
				values.allowedVenueIds
			);
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
				message: 'Allocation added successfully',
				color: 'green',
			});
			form.reset();
			setSelectedModule(null);
			close();
		},
		onError: (error: Error) => {
			let message = error.message || 'Failed to add allocation';
			let title = 'Error';

			const lowerMsg = message.toLowerCase();
			if (
				lowerMsg.includes('already') ||
				lowerMsg.includes('duplicate') ||
				lowerMsg.includes('exists')
			) {
				title = 'Duplicate Allocation';
			} else if (
				lowerMsg.includes('not available') ||
				lowerMsg.includes('booked') ||
				lowerMsg.includes('conflict')
			) {
				title = 'Scheduling Conflict';
			} else if (
				lowerMsg.includes('failed query') ||
				lowerMsg.includes('insert into')
			) {
				message =
					'Unable to save the allocation. Please try again or contact support if the issue persists.';
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
		selectedModule?.semesters.map((semester) => {
			const className = toClassName(
				semester.programCode,
				semester.semesterName
			);
			return {
				value: semester.semesterModuleId.toString(),
				label: className,
				description: semester.programName,
				searchValue: `${className} ${semester.programName}`,
			};
		}) || [];

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
					<AllocationForm
						form={form}
						venueTypes={venueTypes}
						venues={venues}
						renderTopDetails={() => (
							<>
								<ModuleSearchInput
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
									onChange={(value) => {
										const val = value ? Number(value) : 0;
										form.setFieldValue('semesterModuleId', val);
										if (val) {
											getStudentCountForModule(val).then((count) => {
												form.setFieldValue('numberOfStudents', count);
											});
										} else {
											form.setFieldValue('numberOfStudents', 0);
										}
									}}
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
							</>
						)}
						renderMiddleDetails={() => (
							<Stack gap='xs'>
								<Text size='sm' fw={500}>
									Number of Groups
								</Text>
								<Slider
									value={form.values.numberOfGroups}
									onChange={handleGroupCountChange}
									min={1}
									max={10}
									step={1}
									marks={[
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
										value === 1 ? 'All Students' : `${value} Groups`
									}
								/>
								<Text size='xs' c='dimmed' mt='md'>
									{form.values.numberOfGroups === 1
										? 'Assign the entire class to this lecturer'
										: `Split the class into ${form.values.numberOfGroups} groups`}
								</Text>
							</Stack>
						)}
					/>

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
