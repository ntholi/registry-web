'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { referralSessionType } from '@student-services/_database';
import { IconPlus } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { addReferralSession } from '../_server/actions';

type Props = {
	referralId: string;
};

const typeOptions = referralSessionType.enumValues.map((t) => ({
	value: t,
	label: toTitleCase(t),
}));

export default function AddSessionModal({ referralId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [sessionDate, setSessionDate] = useState<string | null>(null);
	const [sessionType, setSessionType] = useState<string | null>(null);
	const [notes, setNotes] = useState('');

	const { mutate, isPending } = useActionMutation(
		async () =>
			addReferralSession({
				referralId,
				sessionDate: sessionDate ?? '',
				sessionType:
					sessionType as (typeof referralSessionType.enumValues)[number],
				notes,
			}),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['referral', referralId] });
				queryClient.invalidateQueries({
					queryKey: ['referral-sessions', referralId],
				});
				close();
				setSessionDate(null);
				setSessionType(null);
				setNotes('');
			},
		}
	);

	return (
		<>
			<ActionIcon variant='light' size='md' onClick={open}>
				<IconPlus size={16} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Add Session'>
				<Stack gap='sm'>
					<DateInput
						label='Session Date'
						value={sessionDate}
						onChange={setSessionDate}
						required
						firstDayOfWeek={0}
					/>
					<Select
						label='Session Type'
						placeholder='Select type'
						data={typeOptions}
						value={sessionType}
						onChange={setSessionType}
						required
					/>
					<Textarea
						label='Notes'
						placeholder='Session notes...'
						minRows={3}
						autosize
						value={notes}
						onChange={(e) => setNotes(e.currentTarget.value)}
					/>
					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={() => mutate()}
							loading={isPending}
							disabled={!sessionDate || !sessionType}
						>
							Add Session
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
