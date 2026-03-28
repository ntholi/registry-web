'use client';

import {
	Badge,
	Button,
	Center,
	Divider,
	Group,
	Loader,
	Modal,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import {
	closeReferral,
	getReferral,
	updateReferralStatus,
} from '../_server/actions';
import SessionList from './SessionList';

const VALID_TRANSITIONS: Record<string, string[]> = {
	pending: ['in_progress'],
	in_progress: ['resolved'],
	resolved: ['closed'],
};

export default function ReferralDetail() {
	const params = useParams();
	const id = params.id as string;

	const {
		data: referral,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['referral', id],
		queryFn: () => getReferral(id),
		enabled: !!id,
	});

	if (isLoading) {
		return (
			<Center h='60vh'>
				<Loader />
			</Center>
		);
	}

	if (error || !referral) {
		return notFound();
	}

	const nextStatuses = VALID_TRANSITIONS[referral.status] ?? [];

	return (
		<DetailsView>
			<DetailsViewHeader
				title={`Referral — ${referral.student?.name ?? referral.stdNo}`}
				queryKey={['referrals']}
			/>
			<DetailsViewBody>
				<Stack gap='lg'>
					<Group gap='sm'>
						<Badge color={getStatusColor(referral.status as AllStatusType)}>
							{toTitleCase(referral.status)}
						</Badge>
						{nextStatuses.map((s) =>
							s === 'closed' ? (
								<CloseReferralModal key={s} id={id} />
							) : (
								<StatusTransitionButton key={s} id={id} nextStatus={s} />
							)
						)}
					</Group>

					<FieldView label='Student'>
						<Link href={`/registry/students/${referral.stdNo}`}>
							{referral.student?.name} ({referral.stdNo})
						</Link>
					</FieldView>

					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<FieldView label='Reason' tt='capitalize'>
							{referral.reason === 'other'
								? referral.otherReason
								: toTitleCase(referral.reason)}
						</FieldView>
						<FieldView label='Referred By'>
							{referral.referrer?.name ?? '—'}
						</FieldView>
					</SimpleGrid>

					{referral.assignee && (
						<FieldView label='Assigned To'>{referral.assignee.name}</FieldView>
					)}

					<FieldView label='Description'>{referral.description}</FieldView>

					{referral.resolutionSummary && (
						<FieldView label='Resolution Summary'>
							{referral.resolutionSummary}
						</FieldView>
					)}

					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<FieldView label='Created'>
							{formatDateTime(referral.createdAt, 'long')}
						</FieldView>
						{referral.closedAt && (
							<FieldView label='Closed'>
								{formatDateTime(referral.closedAt, 'long')} by{' '}
								{referral.closer?.name}
							</FieldView>
						)}
					</SimpleGrid>

					<Divider />

					<SessionList referralId={id} sessions={referral.sessions ?? []} />
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}

type StatusButtonProps = {
	id: string;
	nextStatus: string;
};

function StatusTransitionButton({ id, nextStatus }: StatusButtonProps) {
	const queryClient = useQueryClient();

	const { mutate, isPending } = useActionMutation(
		async () => updateReferralStatus(id, nextStatus),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['referral', id] });
				queryClient.invalidateQueries({ queryKey: ['referrals'] });
			},
		}
	);

	return (
		<Button
			size='xs'
			variant='light'
			onClick={() => mutate()}
			loading={isPending}
		>
			Mark as {toTitleCase(nextStatus)}
		</Button>
	);
}

type CloseModalProps = {
	id: string;
};

function CloseReferralModal({ id }: CloseModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [summary, setSummary] = useState('');

	const { mutate, isPending } = useActionMutation(
		async () => closeReferral(id, summary),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['referral', id] });
				queryClient.invalidateQueries({ queryKey: ['referrals'] });
				close();
				setSummary('');
			},
		}
	);

	return (
		<>
			<Button size='xs' variant='light' color='gray' onClick={open}>
				Close Referral
			</Button>
			<Modal opened={opened} onClose={close} title='Close Referral'>
				<Stack gap='sm'>
					<Text size='sm' c='dimmed'>
						Provide a summary of the resolution before closing.
					</Text>
					<Textarea
						label='Resolution Summary'
						placeholder='Describe how this referral was resolved...'
						minRows={3}
						autosize
						value={summary}
						onChange={(e) => setSummary(e.currentTarget.value)}
						required
					/>
					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={() => mutate()}
							loading={isPending}
							disabled={!summary.trim()}
						>
							Close Referral
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
