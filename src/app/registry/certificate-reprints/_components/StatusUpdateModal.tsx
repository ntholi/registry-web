'use client';

import {
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	SegmentedControl,
	Stack,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { certificateReprintStatus } from '@registry/_database';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { authClient } from '@/core/auth-client';
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
	const { data: session } = authClient.useSession();
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
			<Paper withBorder p='sm'>
				<Group justify='space-between' align='center'>
					<Stack gap={2}>
						<Badge color={color} variant='light' radius='xs'>
							{labels[initial]}
						</Badge>
					</Stack>
					<Button onClick={handleOpen} size='xs' variant='light'>
						Update
					</Button>
				</Group>
			</Paper>

			<Modal opened={opened} onClose={close} title='Update Status'>
				<Stack>
					<SegmentedControl
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
