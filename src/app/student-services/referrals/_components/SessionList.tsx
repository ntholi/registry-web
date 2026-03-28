'use client';

import { ActionIcon, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { formatDate } from '@/shared/lib/utils/dates';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { deleteReferralSession } from '../_server/actions';
import AddSessionModal from './AddSessionModal';

type Session = {
	id: string;
	sessionDate: string | null;
	sessionType: string;
	notes: string | null;
	conductor: { id: string; name: string } | null;
};

type Props = {
	referralId: string;
	sessions: Session[];
};

export default function SessionList({ referralId, sessions }: Props) {
	const queryClient = useQueryClient();

	return (
		<Stack gap='sm'>
			<Group justify='space-between'>
				<Title order={5}>Sessions ({sessions.length})</Title>
				<AddSessionModal referralId={referralId} />
			</Group>
			{sessions.length === 0 && (
				<Text size='sm' c='dimmed'>
					No sessions recorded yet.
				</Text>
			)}
			{sessions.map((s) => (
				<SessionCard
					key={s.id}
					session={s}
					referralId={referralId}
					queryClient={queryClient}
				/>
			))}
		</Stack>
	);
}

type SessionCardProps = {
	session: Session;
	referralId: string;
	queryClient: ReturnType<typeof useQueryClient>;
};

function SessionCard({ session, referralId, queryClient }: SessionCardProps) {
	const { mutate, isPending } = useActionMutation(
		async () => deleteReferralSession(session.id),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['referral', referralId] });
				queryClient.invalidateQueries({
					queryKey: ['referral-sessions', referralId],
				});
			},
		}
	);

	return (
		<Paper withBorder p='sm' radius='md' bg='transparent'>
			<Group justify='space-between' align='flex-start'>
				<Stack gap={4}>
					<Group gap='xs'>
						<Text size='sm' fw={600}>
							{toTitleCase(session.sessionType)}
						</Text>
						<Text size='xs' c='dimmed'>
							{formatDate(session.sessionDate, 'long')}
						</Text>
					</Group>
					{session.conductor && (
						<Text size='xs' c='dimmed'>
							By {session.conductor.name}
						</Text>
					)}
					{session.notes && (
						<Text size='sm' mt={4}>
							{session.notes}
						</Text>
					)}
				</Stack>
				<ActionIcon
					variant='subtle'
					color='red'
					size='sm'
					onClick={() => mutate()}
					loading={isPending}
				>
					<IconTrash size={14} />
				</ActionIcon>
			</Group>
		</Paper>
	);
}
