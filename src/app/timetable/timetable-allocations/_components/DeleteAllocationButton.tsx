'use client';

import { ActionIcon, List, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrashFilled } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import { deleteTimetableAllocations } from '../_server/actions';
import type { AllocationData } from './AllocationTable';

type Props = {
	allocation: AllocationData;
	allAllocations: AllocationData[];
	userId: string;
};

export default function DeleteAllocationButton({
	allocation,
	allAllocations,
	userId,
}: Props) {
	const queryClient = useQueryClient();

	const relatedAllocations = allAllocations.filter(
		(a) =>
			a.id !== allocation.id &&
			a.semesterModule.module.code === allocation.semesterModule.module.code &&
			a.semesterModule.semester?.semesterNumber ===
				allocation.semesterModule.semester?.semesterNumber &&
			a.semesterModule.semester?.structure?.program.code ===
				allocation.semesterModule.semester?.structure?.program.code &&
			a.classType === allocation.classType
	);

	const hasRelatedGroups =
		relatedAllocations.length > 0 && allocation.groupName !== null;

	const allocationIds = hasRelatedGroups
		? [allocation.id, ...relatedAllocations.map((a) => a.id)]
		: [allocation.id];

	const mutation = useMutation({
		mutationFn: async () => {
			const result = await deleteTimetableAllocations(allocationIds);
			if (!result.success) {
				throw new Error(result.error);
			}
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['timetable-allocations', userId],
				refetchType: 'all',
			});
			await queryClient.invalidateQueries({
				queryKey: ['timetable-slots'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: hasRelatedGroups
					? `${allocationIds.length} allocations deleted successfully`
					: 'Allocation deleted successfully',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'An error occurred while deleting',
				color: 'red',
			});
		},
	});

	function openModal() {
		const className = getStudentClassName(
			allocation.semesterModule.semester,
			allocation.groupName
		);

		if (hasRelatedGroups) {
			const allGroups = [allocation, ...relatedAllocations];
			modals.openConfirmModal({
				title: 'Delete Multiple Allocations',
				children: (
					<Stack gap='sm'>
						<Text size='sm'>
							This allocation is part of a class with multiple groups. Deleting
							this will also delete all related group allocations:
						</Text>
						<List size='sm'>
							{allGroups.map((a) => (
								<List.Item key={a.id}>
									{getStudentClassName(a.semesterModule.semester, a.groupName)}
								</List.Item>
							))}
						</List>
						<Text size='sm' c='red' fw={500}>
							Are you sure you want to delete all {allGroups.length} allocations
							for {allocation.semesterModule.module.code}?
						</Text>
					</Stack>
				),
				labels: {
					confirm: `Delete All (${allGroups.length})`,
					cancel: 'Cancel',
				},
				confirmProps: { color: 'red' },
				onConfirm: () => mutation.mutate(),
			});
		} else {
			modals.openConfirmModal({
				title: 'Confirm Delete',
				children: (
					<Text size='sm'>
						Are you sure you want to delete the allocation for {className}?
					</Text>
				),
				labels: { confirm: 'Delete', cancel: 'Cancel' },
				confirmProps: { color: 'red' },
				onConfirm: () => mutation.mutate(),
			});
		}
	}

	return (
		<ActionIcon
			color='red'
			loading={mutation.isPending}
			onClick={openModal}
			variant='subtle'
			size='sm'
		>
			<IconTrashFilled size='1rem' />
		</ActionIcon>
	);
}
