'use client';

import {
	ActionIcon,
	Button,
	Divider,
	Flex,
	Group,
	Modal,
	SegmentedControl,
	Textarea,
	Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useState } from 'react';
import type { DepositStatus } from '@/core/database';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import {
	getNextPaymentForReview,
	releasePaymentReviewLock,
	updatePaymentReviewStatus,
} from '../_server/actions';

type Props = {
	id: string;
	title: string;
	status: DepositStatus;
};

const STATUS_OPTIONS: { value: DepositStatus; label: string }[] = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

export default function PaymentReviewHeader({ id, title, status }: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<DepositStatus>(status);
	const [rejectionReason, setRejectionReason] = useState('');
	const [opened, { open, close }] = useDisclosure(false);

	const isDirty = selected !== status;

	const navigateToNext = useCallback(async () => {
		const next = await getNextPaymentForReview(id, { status: 'pending' });
		if (next) {
			router.push(`/admissions/payments/${next.id}`);
		} else {
			router.push('/admissions/payments');
		}
	}, [id, router]);

	const mutation = useMutation({
		mutationFn: async (reason?: string) => {
			await updatePaymentReviewStatus(id, selected, reason);
			await releasePaymentReviewLock(id);
		},
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ['payments-review'] });
			close();
			setRejectionReason('');
			await navigateToNext();
		},
	});

	function handleSave() {
		if (selected === 'rejected') {
			open();
			return;
		}
		mutation.mutate(undefined);
	}

	function confirmReject() {
		mutation.mutate(rejectionReason || undefined);
	}

	return (
		<>
			<Modal opened={opened} onClose={close} title='Rejection Reason' centered>
				<Textarea
					placeholder='Reason for rejection (optional)...'
					value={rejectionReason}
					onChange={(e) => setRejectionReason(e.currentTarget.value)}
					autosize
					minRows={3}
					maxRows={6}
					mb='md'
				/>
				<Group justify='flex-end'>
					<Button variant='default' onClick={close}>
						Cancel
					</Button>
					<Button
						color='red'
						loading={mutation.isPending}
						onClick={confirmReject}
					>
						Confirm Rejection
					</Button>
				</Group>
			</Modal>

			<Flex justify='space-between' align='center' gap='sm' wrap='wrap'>
				{isMobile ? (
					<Group>
						<ActionIcon variant='default' onClick={() => setView('nav')}>
							<IconArrowNarrowLeft size='1rem' />
						</ActionIcon>
						<Title order={3} fw={100} size='1rem'>
							{title}
						</Title>
					</Group>
				) : (
					<Title order={3} fw={100}>
						{title}
					</Title>
				)}

				<Group gap='xs'>
					<SegmentedControl
						size='sm'
						value={selected}
						color='teal'
						onChange={(val) => setSelected(val as DepositStatus)}
						data={STATUS_OPTIONS}
					/>
					<Button
						size='sm'
						disabled={!isDirty}
						loading={mutation.isPending && selected !== 'rejected'}
						onClick={handleSave}
					>
						Save
					</Button>
				</Group>
			</Flex>
			<Divider my={15} />
		</>
	);
}
