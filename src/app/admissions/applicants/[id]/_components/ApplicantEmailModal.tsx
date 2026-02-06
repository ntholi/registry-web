'use client';

import type { users } from '@auth/_database';
import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import UserInput from '@/shared/ui/UserInput';
import { updateApplicantUserId } from '../../_server/actions';

type User = typeof users.$inferSelect;

interface ApplicantEmailModalProps {
	applicantId: string;
	currentUser: User | null;
}

export default function ApplicantEmailModal({
	applicantId,
	currentUser,
}: ApplicantEmailModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(currentUser);
	const router = useRouter();

	const handleOpen = () => {
		setSelectedUser(currentUser);
		open();
	};

	const updateUserMutation = useMutation({
		mutationFn: async (userId: string | null) => {
			return updateApplicantUserId(applicantId, userId);
		},
		onSuccess: () => {
			notifications.show({
				message: 'User updated successfully',
				color: 'green',
			});
			router.refresh();
			close();
		},
		onError: (error) => {
			notifications.show({
				message: `Failed to update user: ${error.message}`,
				color: 'red',
			});
		},
	});

	const handleSave = () => {
		updateUserMutation.mutate(selectedUser?.id || null);
	};

	return (
		<>
			<Group gap={'sm'}>
				<Text size='sm' c='dimmed'>
					{currentUser?.email ?? 'No email'}
				</Text>
				<Tooltip label='Edit User'>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='xs'
						onClick={handleOpen}
					>
						<IconEdit size={14} />
					</ActionIcon>
				</Tooltip>
			</Group>

			<Modal opened={opened} onClose={close} title='Edit User' size='md'>
				<Stack gap='md'>
					<Text size='sm' c='dimmed'>
						Select a user to associate with this applicant, or remove the
						association.
					</Text>

					<UserInput
						label='User'
						value={selectedUser}
						onChange={setSelectedUser}
					/>

					{currentUser && (
						<Group gap='xs' justify='space-between'>
							<Group gap='xs'>
								<Text size='sm' c='dimmed'>
									Current user:
								</Text>
								<Text size='sm' fw={500}>
									{currentUser.name || currentUser.email}
								</Text>
							</Group>
							{selectedUser && (
								<Button
									variant='subtle'
									color='red'
									size='xs'
									onClick={() => setSelectedUser(null)}
								>
									Unlink User
								</Button>
							)}
						</Group>
					)}

					{!currentUser && selectedUser && (
						<Button
							variant='subtle'
							color='red'
							size='xs'
							onClick={() => setSelectedUser(null)}
						>
							Clear Selection
						</Button>
					)}

					<Group justify='flex-end' gap='sm'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							loading={updateUserMutation.isPending}
							disabled={selectedUser?.id === currentUser?.id}
							color={!selectedUser && currentUser ? 'red' : undefined}
						>
							{!selectedUser && currentUser ? 'Unlink User' : 'Save'}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
