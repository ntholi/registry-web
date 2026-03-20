import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { getSentLogEntry } from '../../queues/_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SentDetailPage({ params }: Props) {
	const { id } = await params;
	const entry = await getSentLogEntry(Number(id));

	if (!entry) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Sent Email'
				queryKey={['mail-sent-log']}
				hideEdit
			/>
			<DetailsViewBody>
				<FieldView label='To'>{entry.to}</FieldView>
				<FieldView label='CC'>{entry.cc || '-'}</FieldView>
				<FieldView label='BCC'>{entry.bcc || '-'}</FieldView>
				<FieldView label='Subject'>{entry.subject}</FieldView>
				<FieldView label='Status'>
					<Badge
						variant='light'
						color={entry.status === 'sent' ? 'green' : 'red'}
					>
						{entry.status === 'sent' ? 'Sent' : 'Failed'}
					</Badge>
				</FieldView>
				{entry.error && <FieldView label='Error'>{entry.error}</FieldView>}
				<FieldView label='Trigger Type'>
					<Badge variant='light' color='gray'>
						{entry.triggerType}
					</Badge>
				</FieldView>
				{entry.triggerEntityId && (
					<FieldView label='Trigger Entity'>{entry.triggerEntityId}</FieldView>
				)}
				<FieldView label='Sent By'>
					{entry.sentByUser?.name || entry.sentByUser?.email || 'System'}
				</FieldView>
				<FieldView label='Sent At'>{formatDateTime(entry.sentAt)}</FieldView>
				<FieldView label='Gmail Message ID'>
					{entry.gmailMessageId || '-'}
				</FieldView>
				<FieldView label='Snippet'>{entry.snippet || '-'}</FieldView>
				<FieldView label='Account'>{entry.account?.email || '-'}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
