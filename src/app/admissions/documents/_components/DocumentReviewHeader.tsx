'use client';

import {
	ActionIcon,
	Badge,
	Divider,
	Flex,
	Group,
	Menu,
	Textarea,
	Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
	IconArrowNarrowLeft,
	IconCheck,
	IconChevronDown,
	IconClock,
	IconX,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DocumentVerificationStatus } from '@/core/database';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import { DeleteButton } from '@/shared/ui/adease';
import { updateDocumentStatus } from '../_server/actions';

type Props = {
	id: string;
	title: string;
	status: DocumentVerificationStatus;
	handleDelete?: () => Promise<void>;
};

const STATUS_CONFIG: Record<
	DocumentVerificationStatus,
	{ label: string; icon: React.ReactNode }
> = {
	pending: { label: 'Pending', icon: <IconClock size={14} /> },
	verified: { label: 'Verified', icon: <IconCheck size={14} /> },
	rejected: { label: 'Rejected', icon: <IconX size={14} /> },
};

export default function DocumentReviewHeader({
	id,
	title,
	status,
	handleDelete,
}: Props) {
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const queryClient = useQueryClient();
	const [rejectionReason, setRejectionReason] = useState('');
	const [showReject, setShowReject] = useState(false);

	const statusMutation = useMutation({
		mutationFn: async ({
			newStatus,
			reason,
		}: {
			newStatus: DocumentVerificationStatus;
			reason?: string;
		}) => {
			return updateDocumentStatus(id, newStatus, reason);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['documents-review'] });
			router.refresh();
			setShowReject(false);
			setRejectionReason('');
		},
	});

	const handleStatusChange = (newStatus: DocumentVerificationStatus) => {
		if (newStatus === 'rejected') {
			setShowReject(true);
			return;
		}
		statusMutation.mutate({ newStatus });
	};

	const confirmReject = () => {
		statusMutation.mutate({
			newStatus: 'rejected',
			reason: rejectionReason || undefined,
		});
	};

	const currentConfig = STATUS_CONFIG[status];
	const color = getDocumentVerificationStatusColor(status);

	return (
		<>
			<Flex justify='space-between' align='center'>
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

				<Group gap='sm'>
					<Menu shadow='md' width={200} position='bottom-end'>
						<Menu.Target>
							<Badge
								variant='light'
								color={color}
								size='lg'
								rightSection={<IconChevronDown size={12} />}
								style={{ cursor: 'pointer' }}
							>
								{currentConfig.label}
							</Badge>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Label>Change status</Menu.Label>
							{(
								Object.entries(STATUS_CONFIG) as [
									DocumentVerificationStatus,
									(typeof STATUS_CONFIG)[DocumentVerificationStatus],
								][]
							).map(([key, config]) => (
								<Menu.Item
									key={key}
									leftSection={config.icon}
									disabled={key === status}
									onClick={() => handleStatusChange(key)}
									color={getDocumentVerificationStatusColor(key)}
								>
									{config.label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
					{handleDelete && (
						<DeleteButton
							handleDelete={handleDelete}
							queryKey={['documents-review']}
						/>
					)}
				</Group>
			</Flex>
			{showReject && (
				<Group mt='xs' align='flex-end' gap='xs'>
					<Textarea
						placeholder='Reason for rejection (optional)...'
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.currentTarget.value)}
						style={{ flex: 1 }}
						size='sm'
						autosize
						minRows={1}
						maxRows={3}
					/>
					<Group gap={4}>
						<ActionIcon
							color='red'
							variant='filled'
							onClick={confirmReject}
							loading={statusMutation.isPending}
						>
							<IconCheck size={14} />
						</ActionIcon>
						<ActionIcon
							variant='default'
							onClick={() => {
								setShowReject(false);
								setRejectionReason('');
							}}
						>
							<IconX size={14} />
						</ActionIcon>
					</Group>
				</Group>
			)}
			<Divider my={15} />
		</>
	);
}
