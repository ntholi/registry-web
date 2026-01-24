'use client';
import { ActionIcon, type ActionIconProps } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrashFilled } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DeleteModal } from './DeleteModal';

export interface DeleteButtonProps extends ActionIconProps {
	handleDelete: () => Promise<void>;
	message?: string;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
	queryKey?: string[];
	itemName?: string;
	itemType?: string;
}

export function DeleteButton({
	handleDelete,
	message,
	onSuccess,
	onError,
	queryKey,
	itemName = 'this item',
	itemType = 'Item',
	...props
}: DeleteButtonProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);

	const mutation = useMutation({
		mutationFn: handleDelete,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey,
				refetchType: 'all',
			});
			if (onSuccess) {
				onSuccess();
			} else {
				notifications.show({
					title: 'Success',
					message: 'Item deleted successfully',
					color: 'green',
				});
				router.back();
			}
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'An error occurred while deleting',
				color: 'red',
			});
			onError?.(error);
		},
	});

	return (
		<>
			<ActionIcon
				color='red'
				loading={mutation.isPending}
				onClick={open}
				{...props}
			>
				<IconTrashFilled size={'1rem'} />
			</ActionIcon>
			<DeleteModal
				opened={opened}
				onClose={close}
				onDelete={async () => mutation.mutateAsync()}
				itemName={itemName}
				itemType={itemType}
				warningMessage={message}
			/>
		</>
	);
}
