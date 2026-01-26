'use client';

import {
	Alert,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { getAlertColor } from '@/shared/lib/utils/colors';
import { setAllocationOverflowVenue } from '../_server/actions';

interface OverflowOption {
	venueId: string;
	venueName: string;
	capacity: number;
}

interface OverflowData {
	allocationId: number;
	numberOfStudents: number;
	options: OverflowOption[];
}

export interface OverflowVenueModalRef {
	open: (data: OverflowData) => void;
}

const OverflowVenueModal = forwardRef<OverflowVenueModalRef>(
	function Cmp(_, ref) {
		const [opened, { open, close }] = useDisclosure(false);
		const queryClient = useQueryClient();
		const [data, setData] = useState<OverflowData | null>(null);
		const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

		useImperativeHandle(ref, () => ({
			open: (overflowData: OverflowData) => {
				setData(overflowData);
				setSelectedVenueId(null);
				open();
			},
		}));

		const mutation = useMutation({
			mutationFn: async () => {
				if (!data || !selectedVenueId) {
					throw new Error('No venue selected');
				}
				const result = await setAllocationOverflowVenue(
					data.allocationId,
					selectedVenueId
				);
				if (!result.success) {
					throw new Error(result.error);
				}
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
					message: 'Overflow venue set and slot allocated',
					color: getAlertColor('success'),
				});
				close();
			},
			onError: (error: Error) => {
				notifications.show({
					title: 'Error',
					message: error.message,
					color: getAlertColor('error'),
				});
			},
		});

		const venueOptions =
			data?.options.map((opt) => ({
				value: opt.venueId,
				label: `${opt.venueName} (capacity: ${opt.capacity})`,
			})) ?? [];

		const selectedVenue = data?.options.find(
			(v) => v.venueId === selectedVenueId
		);

		return (
			<Modal
				opened={opened}
				onClose={close}
				title='Allow Venue Overflow'
				size='md'
			>
				<Stack gap='md'>
					<Alert
						icon={<IconAlertTriangle size={18} />}
						color='yellow'
						title='No Venue Fits Capacity'
					>
						<Text size='sm'>
							No venue can fit {data?.numberOfStudents} students with the 10%
							overflow limit. Select a venue below to bypass capacity for this
							allocation.
						</Text>
					</Alert>

					<Select
						label='Select Overflow Venue'
						placeholder='Choose a venue'
						data={venueOptions}
						value={selectedVenueId}
						onChange={setSelectedVenueId}
						searchable
						required
					/>

					{selectedVenue && data && (
						<Alert color='orange' variant='light'>
							<Text size='sm'>
								<strong>{selectedVenue.venueName}</strong> has capacity for{' '}
								{selectedVenue.capacity} students. You are allocating{' '}
								{data.numberOfStudents} students (
								{Math.round(
									(data.numberOfStudents / selectedVenue.capacity) * 100
								)}
								% of capacity).
							</Text>
						</Alert>
					)}

					<Group justify='flex-end'>
						<Button variant='subtle' onClick={close}>
							Cancel
						</Button>
						<Button
							color='orange'
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={!selectedVenueId}
						>
							Allow Overflow
						</Button>
					</Group>
				</Stack>
			</Modal>
		);
	}
);

export default OverflowVenueModal;
