'use client';

import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { certificateReprintStatus } from '@registry/_database';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import { updateCertificateReprint } from '../_server/actions';

type Status = (typeof certificateReprintStatus.enumValues)[number];

type Props = {
	id: string;
	status: Status;
};

const labels: Record<Status, string> = {
	pending: 'Pending',
	printed: 'Printed',
};

export default function StatusUpdateModal({ id, status: initial }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<Status>(initial);
	const [receivedAt, setReceivedAt] = useState<string | null>(
		formatDateToISO(new Date())
	);

	const { mutate, isPending } = useMutation({
		mutationFn: () => {
			const data: Record<string, unknown> = { status };
			if (status === 'printed') {
				data.receivedAt = receivedAt ? new Date(receivedAt) : new Date();
				data.receivedBy = session?.user?.id;
			} else {
				data.receivedAt = null;
				data.receivedBy = null;
			}
			return updateCertificateReprint(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['certificate-reprints'] });
			notifications.show({
				title: 'Updated',
				message: 'Status updated successfully',
				color: 'green',
			});
			close();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update status',
				color: 'red',
			});
		},
	});

	function handleOpen() {
		setStatus(initial);
		setReceivedAt(formatDateToISO(new Date()));
		open();
	}

	const color =
		initial === 'printed'
			? getStatusColor('approved')
			: getStatusColor('pending');

	return (
		<>
			<Card withBorder p='sm'>
				<Group justify='space-between'>
					<Stack gap={2}>
						<Text size='xs' c='dimmed'>
							Status
						</Text>
						<Badge color={color} variant='light' size='lg'>
							{labels[initial]}
						</Badge>
					</Stack>
					<ActionIcon variant='subtle' color='gray' onClick={handleOpen}>
						<IconEdit size={18} />
					</ActionIcon>
				</Group>
			</Card>

			<Modal opened={opened} onClose={close} title='Update Status'>
				<Stack>
					<Select
						label='Status'
						value={status}
						onChange={(v) => setStatus(v as Status)}
						data={certificateReprintStatus.enumValues.map((s) => ({
							value: s,
							label: labels[s],
						}))}
					/>
					{status === 'printed' && (
						<>
							<TextInput
								label='Received By'
								value={session?.user?.name ?? ''}
								readOnly
								variant='filled'
							/>
							<DateInput
								label='Date Received'
								value={receivedAt}
								onChange={setReceivedAt}
								firstDayOfWeek={0}
							/>
						</>
					)}
					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button onClick={() => mutate()} loading={isPending}>
							Update
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
