'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { certificateReprintStatus } from '@registry/_database';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateCertificateReprint } from '../_server/actions';

type Status = (typeof certificateReprintStatus.enumValues)[number];

type Props = {
	id: string;
	status: Status;
};

export default function StatusSwitch({ id, status: initial }: Props) {
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<Status>(initial);

	const { mutate, isPending } = useMutation({
		mutationFn: (next: Status) =>
			updateCertificateReprint(id, { status: next }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['certificate-reprints'] });
			notifications.show({
				title: 'Updated',
				message: 'Status updated successfully',
				color: 'green',
			});
		},
		onError: () => {
			setStatus(initial);
			notifications.show({
				title: 'Error',
				message: 'Failed to update status',
				color: 'red',
			});
		},
	});

	return (
		<Stack gap={6}>
			<Text size='sm' fw={500} c='dimmed'>
				Status
			</Text>
			<SegmentedControl
				value={status}
				onChange={(v) => {
					const next = v as Status;
					setStatus(next);
					mutate(next);
				}}
				disabled={isPending}
				data={certificateReprintStatus.enumValues.map((s) => ({
					value: s,
					label: s === 'pending' ? 'Pending' : 'Printed',
				}))}
				fullWidth
			/>
		</Stack>
	);
}
