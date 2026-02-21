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
import { useCallback, useEffect, useState } from 'react';
import type { DocumentVerificationStatus } from '@/core/database';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import {
	getNextDocument,
	releaseReviewLock,
	updateDocumentStatus,
} from '../_server/actions';

type Props = {
	id: string;
	title: string;
	status: DocumentVerificationStatus;
};

const STATUS_OPTIONS: { value: DocumentVerificationStatus; label: string }[] = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

export default function DocumentReviewHeader({ id, title, status }: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<DocumentVerificationStatus>(status);
	const [rejectionReason, setRejectionReason] = useState('');
	const [opened, { open, close }] = useDisclosure(false);

	const isDirty = selected !== status;

	const navigateToNext = useCallback(async () => {
		const next = await getNextDocument(id, { status: 'pending' });
		if (next) {
			router.push(`/admissions/documents/${next.id}`);
		} else {
			router.push('/admissions/documents');
		}
	}, [id, router]);

	const mutation = useMutation({
		mutationFn: async (reason?: string) => {
			await updateDocumentStatus(id, selected, reason);
			await releaseReviewLock(id);
		},
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ['documents-review'] });
			close();
			setRejectionReason('');
			await navigateToNext();
		},
	});

	useEffect(() => {
		const handleBeforeUnload = () => {
			navigator.sendBeacon(
				'/api/admissions/documents/release-lock',
				JSON.stringify({ documentId: id })
			);
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			releaseReviewLock(id);
		};
	}, [id]);

	const handleSave = () => {
		if (selected === 'rejected') {
			open();
		} else {
			mutation.mutate(undefined);
		}
	};

	const confirmReject = () => {
		mutation.mutate(rejectionReason || undefined);
	};

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
						onChange={(val) => setSelected(val as DocumentVerificationStatus)}
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
