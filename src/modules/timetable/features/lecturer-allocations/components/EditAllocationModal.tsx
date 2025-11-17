'use client';

import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Modal,
	MultiSelect,
	NumberInput,
	Stack,
	Tabs,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import DurationInput from '@/shared/ui/DurationInput';
import {
	updateLecturerAllocation,
	updateLecturerAllocationVenueTypes,
} from '../server/actions';

const schema = z.object({
	duration: z.number().min(1, 'Please enter a valid duration'),
	numberOfStudents: z.number().min(0),
	venueTypeIds: z.array(z.number()),
	allowedDays: z.array(z.string()).min(1, 'Please select at least one day'),
	startTime: z.string().min(1, 'Please enter a start time'),
	endTime: z.string().min(1, 'Please enter an end time'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	allocationId: number;
	currentDuration: number;
	currentNumberOfStudents: number;
	currentVenueTypeIds: number[];
	currentAllowedDays: string[];
	currentStartTime: string;
	currentEndTime: string;
};

export default function EditAllocationModal({
	allocationId,
	currentDuration,
	currentNumberOfStudents,
	currentVenueTypeIds,
	currentAllowedDays,
	currentStartTime,
	currentEndTime,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const { data: venueTypes = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
	});

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			duration: currentDuration,
			numberOfStudents: currentNumberOfStudents,
			venueTypeIds: currentVenueTypeIds,
			allowedDays: currentAllowedDays,
			startTime: currentStartTime,
			endTime: currentEndTime,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			await updateLecturerAllocation(allocationId, {
				duration: values.duration,
				numberOfStudents: values.numberOfStudents,
				allowedDays: values.allowedDays,
				startTime: values.startTime,
				endTime: values.endTime,
			});
			await updateLecturerAllocationVenueTypes(
				allocationId,
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
				message: 'Allocation updated successfully',
				color: 'green',
			});
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to update allocation',
				color: 'red',
			});
		},
	});

	const handleSubmit = (values: FormValues) => {
		mutation.mutate(values);
	};

	const handleOpen = () => {
		form.setValues({
			duration: currentDuration,
			numberOfStudents: currentNumberOfStudents,
			venueTypeIds: currentVenueTypeIds,
			allowedDays: currentAllowedDays,
			startTime: currentStartTime,
			endTime: currentEndTime,
		});
		open();
	};

	return (
		<>
			<ActionIcon variant='subtle' color='blue' size='sm' onClick={handleOpen}>
				<IconEdit size={16} />
			</ActionIcon>

			<Modal opened={opened} onClose={close} title='Edit Allocation' size='md'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Tabs defaultValue='details'>
						<Tabs.List>
							<Tabs.Tab value='details'>Details</Tabs.Tab>
							<Tabs.Tab value='constraints'>Constraints</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='details' pt='md'>
							<Stack gap='md'>
								<DurationInput
									label='Duration'
									value={form.values.duration}
									onChange={(value) => form.setFieldValue('duration', value)}
									error={form.errors.duration}
									required
								/>
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
									onChange={(value) => form.setFieldValue('allowedDays', value)}
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
							Save Changes
						</Button>
					</Group>
				</form>
			</Modal>
		</>
	);
}
