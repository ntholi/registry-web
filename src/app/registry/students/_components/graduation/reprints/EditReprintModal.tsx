'use client';

import {
	Button,
	Card,
	Group,
	Modal,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { certificateReprints } from '@registry/_database';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCertificateReprint } from '@/app/registry/certificate-reprints';
import { formatDate } from '@/shared/lib/utils/dates';
import { ReceiptInput } from '@/shared/ui/adease';

type CertificateReprint = typeof certificateReprints.$inferSelect;

type Props = {
	reprint: CertificateReprint;
	stdNo: number;
};

type FormValues = {
	receiptNumber: string;
	reason: string;
	receivedAt: Date | null;
};

export default function EditReprintModal({ reprint, stdNo }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		initialValues: {
			receiptNumber: reprint.receiptNumber || '',
			reason: reprint.reason,
			receivedAt: reprint.receivedAt ? new Date(reprint.receivedAt) : null,
		},
		validate: {
			receiptNumber: (value) => {
				if (!value) return null;
				return /^(PMRC\d{5}|SR-\d{5})$/.test(value)
					? null
					: 'Invalid receipt format';
			},
			reason: (value) =>
				value.trim().length < 5 ? 'Reason must be at least 5 characters' : null,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return updateCertificateReprint(reprint.id, {
				receiptNumber: values.receiptNumber || null,
				reason: values.reason,
				receivedAt: values.receivedAt,
				status: values.receivedAt ? 'printed' : 'pending',
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Certificate reprint updated',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['certificate-reprints', stdNo],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to update reprint',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
	}

	function handleSubmit(values: FormValues) {
		mutation.mutate(values);
	}

	return (
		<>
			<Button
				leftSection={<IconEdit size={14} />}
				size='xs'
				variant='light'
				onClick={open}
			>
				Edit
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Edit Certificate Reprint'
				size='md'
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack gap='md'>
						<Card p='sm'>
							<Stack gap={4}>
								<Group gap='xs'>
									<Text size='sm' c='dimmed' w={140}>
										Student No:
									</Text>
									<Text size='sm' fw={500}>
										{stdNo}
									</Text>
								</Group>
								<Group gap='xs'>
									<Text size='sm' c='dimmed' w={140}>
										Created At:
									</Text>
									<Text size='sm' fw={500}>
										{formatDate(reprint.createdAt)}
									</Text>
								</Group>
							</Stack>
						</Card>

						<ReceiptInput
							label='Receipt Number'
							{...form.getInputProps('receiptNumber')}
						/>

						<Textarea
							label='Reason for Reprint'
							placeholder='Enter reason why the certificate needs to be reprinted'
							required
							minRows={3}
							{...form.getInputProps('reason')}
						/>

						<DateInput
							label='Date Received from Printing'
							placeholder='Select date when certificate was received'
							description='Leave empty if not yet received from printing'
							clearable
							firstDayOfWeek={0}
							{...form.getInputProps('receivedAt')}
						/>

						<Group justify='flex-end' mt='md'>
							<Button variant='default' onClick={handleClose}>
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
