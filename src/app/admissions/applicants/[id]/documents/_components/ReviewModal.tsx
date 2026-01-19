'use client';

import { Button, Group, Modal, Radio, Stack, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DocumentVerificationStatus } from '@/core/database';
import { verifyApplicantDocument } from '../_server/actions';

type Props = {
	docId: string;
	initialStatus: DocumentVerificationStatus;
	initialReason?: string | null;
	children: (open: () => void) => React.ReactNode;
};

export function ReviewModal({
	docId,
	initialStatus,
	initialReason,
	children,
}: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [status, setStatus] =
		useState<DocumentVerificationStatus>(initialStatus);
	const [reason, setReason] = useState(initialReason ?? '');

	const mutation = useMutation({
		mutationFn: async () => {
			await verifyApplicantDocument(
				docId,
				status,
				status === 'rejected' ? reason : undefined
			);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document verification updated',
				color: 'green',
			});
			router.refresh();
			close();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update verification',
				color: 'red',
			});
		},
	});

	return (
		<>
			{children(open)}
			<Modal opened={opened} onClose={close} title='Review Document'>
				<Stack gap='md'>
					<Radio.Group
						label='Verification Status'
						value={status}
						onChange={(val) => setStatus(val as DocumentVerificationStatus)}
					>
						<Stack gap='xs' mt='xs'>
							<Radio value='pending' label='Pending' color='yellow' />
							<Radio value='verified' label='Verified' color='green' />
							<Radio value='rejected' label='Rejected' color='red' />
						</Stack>
					</Radio.Group>

					{status === 'rejected' && (
						<Textarea
							label='Rejection Reason'
							required
							placeholder='Enter reason for rejection'
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
						/>
					)}

					<Group justify='flex-end'>
						<Button variant='subtle' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={status === 'rejected' && !reason.trim()}
						>
							Save
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
