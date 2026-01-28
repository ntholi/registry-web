'use client';
import {
	ActionIcon,
	type ActionIconProps,
	Alert,
	Box,
	Button,
	Group,
	Modal,
	Text,
	TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconTrashFilled } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
	cloneElement,
	isValidElement,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	useState,
} from 'react';

export interface DeleteButtonProps extends ActionIconProps {
	handleDelete: () => Promise<void>;
	message?: string;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
	queryKey?: string[];
	itemName?: string;
	itemType?: string;
	warningMessage?: string;
	title?: string;
	typedConfirmation?: boolean;
	children?: ReactNode;
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function DeleteButton({
	handleDelete,
	message,
	onSuccess,
	onError,
	queryKey,
	itemName,
	itemType,
	warningMessage,
	title,
	typedConfirmation = true,
	variant = 'subtle',
	children,
	onClick,
	...props
}: DeleteButtonProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [confirmValue, setConfirmValue] = useState('');

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

	const requiresTypedConfirmation = typedConfirmation;
	const isConfirmed = requiresTypedConfirmation
		? confirmValue === 'delete permanently'
		: true;
	const itemLabel = itemType ?? 'item';
	const itemDescriptor = itemName
		? `${itemLabel} "${itemName}"`
		: `this ${itemLabel}`;
	const descriptionMessage =
		warningMessage ??
		message ??
		'This will permanently remove all associated data. This action cannot be undone.';
	const modalTitle = title ?? `Delete ${itemLabel}`;

	function handleClose() {
		setConfirmValue('');
		close();
	}

	async function handleConfirmDelete() {
		if (!isConfirmed) return;
		try {
			await mutation.mutateAsync();
			handleClose();
		} catch {
			return;
		}
	}

	function handleOpen(event: MouseEvent<HTMLButtonElement>) {
		onClick?.(event);
		open();
	}

	function renderTrigger() {
		if (children) {
			if (isValidElement(children)) {
				const child = children as ReactElement<{
					onClick?: (event: MouseEvent) => void;
				}>;
				return cloneElement(child, {
					onClick: (event: MouseEvent) => {
						child.props.onClick?.(event);
						if (!event.defaultPrevented) {
							open();
						}
					},
				});
			}
			return (
				<Box onClick={open} style={{ display: 'inline-flex' }}>
					{children}
				</Box>
			);
		}

		return (
			<ActionIcon
				color='red'
				loading={mutation.isPending || props.loading}
				variant={variant}
				{...props}
				onClick={handleOpen}
			>
				<IconTrashFilled size={'1rem'} />
			</ActionIcon>
		);
	}

	return (
		<>
			{renderTrigger()}
			<Modal
				opened={opened}
				onClose={handleClose}
				title={modalTitle}
				size='md'
				centered
			>
				<Box mb='md'>
					<Alert
						icon={<IconAlertTriangle size={16} />}
						title='Warning'
						color='red'
						mb='md'
					>
						<Text fw={500} mb='xs'>
							You are about to delete {itemDescriptor}.
						</Text>
						<Text size='sm'>{descriptionMessage}</Text>
					</Alert>

					{requiresTypedConfirmation && (
						<>
							<Text size='sm' mb='md'>
								To confirm deletion, please type{' '}
								<Text span fw={700}>
									delete permanently
								</Text>{' '}
								in the field below:
							</Text>

							<TextInput
								placeholder='delete permanently'
								value={confirmValue}
								onChange={(event) => setConfirmValue(event.target.value)}
								data-autofocus
							/>
						</>
					)}
				</Box>

				<Group justify='right' mt='xl'>
					<Button variant='outline' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						color='red'
						onClick={handleConfirmDelete}
						disabled={!isConfirmed}
						loading={mutation.isPending}
					>
						Delete
					</Button>
				</Group>
			</Modal>
		</>
	);
}
