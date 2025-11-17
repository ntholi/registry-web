'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	MultiSelect,
	NumberInput,
	Stack,
} from '@mantine/core';
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
	numberOfStudents: z.number().min(0).optional(),
	venueTypeIds: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	allocationId: number;
	currentDuration: number;
	currentNumberOfStudents?: number;
	currentVenueTypeIds: number[];
};

export default function EditAllocationModal({
	allocationId,
	currentDuration,
	currentNumberOfStudents,
	currentVenueTypeIds,
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
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			await updateLecturerAllocation(allocationId, {
				duration: values.duration,
				numberOfStudents: values.numberOfStudents,
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
								form.setFieldValue(
									'numberOfStudents',
									value as number | undefined
								)
							}
							error={form.errors.numberOfStudents}
							min={0}
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

						<Group justify='flex-end' mt='md'>
							<Button variant='subtle' onClick={close}>
								Cancel
							</Button>
							<Button type='submit' loading={mutation.isPending}>
								Save Changes
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
