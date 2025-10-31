'use client';

import { ActionIcon, type BoxProps, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteAssignedModule } from '@/server/assigned-modules/actions';

type Props = {
	assignmentId: number;
	moduleName: string;
	userId: string;
} & BoxProps;

export default function DeleteModuleButton({ assignmentId, moduleName, userId, ...props }: Props) {
	const queryClient = useQueryClient();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteModule = async () => {
		modals.openConfirmModal({
			title: 'Delete Module Assignment',
			children: (
				<Text size="sm">
					Are you sure you want to remove the assignment for{' '}
					<Text span fw={500}>
						{moduleName}
					</Text>
					? This action cannot be undone.
				</Text>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: async () => {
				setIsDeleting(true);
				try {
					await deleteAssignedModule(assignmentId);
					await queryClient.invalidateQueries({
						queryKey: ['assigned-modules', userId],
					});
					notifications.show({
						title: 'Success',
						message: 'Module assignment removed successfully',
						color: 'green',
					});
				} catch (error) {
					notifications.show({
						title: 'Error',
						message: `Failed to remove module assignment ${error}`,
						color: 'red',
					});
				} finally {
					setIsDeleting(false);
				}
			},
		});
	};
	return (
		<Tooltip label="Remove assignment">
			<ActionIcon
				{...props}
				variant="subtle"
				color="red"
				onClick={handleDeleteModule}
				loading={isDeleting}
				disabled={isDeleting}
			>
				<IconTrash size={16} />
			</ActionIcon>
		</Tooltip>
	);
}
