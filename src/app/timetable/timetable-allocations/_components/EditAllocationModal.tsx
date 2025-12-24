'use client';

import { ActionIcon, Button, Group, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getActionColor, getAlertColor } from '@student-portal/utils';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import {
	updateTimetableAllocation,
	updateTimetableAllocationVenueTypes,
} from '../_server/actions';
import {
	AllocationForm,
	baseAllocationSchema,
	type DayOfWeek,
} from './AllocationForm';

const schema = baseAllocationSchema.extend({
	numberOfStudents: z.number().min(0),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	allocationId: number;
	currentDuration: number;
	currentClassType: FormValues['classType'];
	currentNumberOfStudents: number;
	currentVenueTypeIds: number[];
	currentAllowedDays: DayOfWeek[];
	currentStartTime: string;
	currentEndTime: string;
};

export default function EditAllocationModal({
	allocationId,
	currentDuration,
	currentClassType,
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
			classType: currentClassType,
			numberOfStudents: currentNumberOfStudents,
			venueTypeIds: currentVenueTypeIds,
			allowedDays: currentAllowedDays,
			startTime: currentStartTime,
			endTime: currentEndTime,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			await updateTimetableAllocation(allocationId, {
				duration: values.duration,
				classType: values.classType,
				numberOfStudents: values.numberOfStudents,
				allowedDays: values.allowedDays,
				startTime: values.startTime,
				endTime: values.endTime,
			});
			await updateTimetableAllocationVenueTypes(
				allocationId,
				values.venueTypeIds
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
				message: 'Allocation updated successfully',
				color: getAlertColor('success'),
			});
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to update allocation',
				color: getAlertColor('error'),
			});
		},
	});

	const handleSubmit = (values: FormValues) => {
		mutation.mutate(values);
	};

	const handleOpen = () => {
		form.setValues({
			duration: currentDuration,
			classType: currentClassType,
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
			<ActionIcon
				variant='subtle'
				color={getActionColor('update')}
				size='sm'
				onClick={handleOpen}
			>
				<IconEdit size={16} />
			</ActionIcon>

			<Modal opened={opened} onClose={close} title='Edit Allocation' size='md'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<AllocationForm form={form} venueTypes={venueTypes} />

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
