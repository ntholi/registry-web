'use client';

import {
	Alert,
	Badge,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import type { certificateReprints } from '@registry/_database';
import { IconClock, IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getCertificateReprintsByStdNo } from '@/app/registry/certificate-reprints';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import EditReprintModal from './EditReprintModal';

type CertificateReprint = typeof certificateReprints.$inferSelect;

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function ReprintsView({ stdNo, isActive = true }: Props) {
	const { data, isLoading, error } = useQuery({
		queryKey: ['certificate-reprints', stdNo],
		queryFn: () => getCertificateReprintsByStdNo(stdNo),
		enabled: isActive,
	});

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (error) {
		return (
			<Alert color='red' title='Error'>
				Failed to load certificate reprints. Please try again.
			</Alert>
		);
	}

	const reprints = data || [];

	if (reprints.length === 0) {
		return (
			<Stack align='center' py='xl' gap='md'>
				<Text size='lg' fw={500} c='dimmed'>
					No reprints found
				</Text>
				<Text size='sm' c='dimmed' ta='center'>
					No certificate reprint requests have been created for this student.
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			{reprints.map((reprint) => (
				<ReprintCard key={reprint.id} reprint={reprint} stdNo={stdNo} />
			))}
		</Stack>
	);
}

type ReprintCardProps = {
	reprint: CertificateReprint;
	stdNo: number;
};

function ReprintCard({ reprint, stdNo }: ReprintCardProps) {
	const isPrinted = reprint.status === 'printed';

	return (
		<Paper withBorder p='md'>
			<Group justify='space-between' align='flex-start'>
				<Stack gap={4} style={{ flex: 1 }}>
					<Group gap='xs'>
						<Text fw={500} size='sm'>
							{reprint.receiptNumber || 'No Receipt'}
						</Text>
						<Badge
							color={getStatusColor(isPrinted ? 'approved' : 'pending')}
							size='xs'
							variant='light'
							leftSection={
								isPrinted ? <IconPrinter size={10} /> : <IconClock size={10} />
							}
						>
							{isPrinted ? 'Printed' : 'Waiting for Printing'}
						</Badge>
					</Group>
					<Text size='xs' c='dimmed' lineClamp={2}>
						{reprint.reason}
					</Text>
					<Text size='xs' c='dimmed'>
						Created: {formatDate(reprint.createdAt)}
					</Text>
					{isPrinted && reprint.receivedAt && (
						<Text size='xs' c='green'>
							Received: {formatDate(reprint.receivedAt)}
						</Text>
					)}
				</Stack>
				<EditReprintModal reprint={reprint} stdNo={stdNo} />
			</Group>
		</Paper>
	);
}

function LoadingSkeleton() {
	return (
		<Stack gap='md'>
			{[1, 2, 3].map((i) => (
				<Paper key={i} withBorder p='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Group gap='xs'>
								<Skeleton height={16} width={100} />
								<Skeleton height={18} width={80} />
							</Group>
							<Skeleton height={12} width={200} />
							<Skeleton height={12} width={120} />
						</Stack>
						<Skeleton height={28} width={60} />
					</Group>
				</Paper>
			))}
		</Stack>
	);
}
