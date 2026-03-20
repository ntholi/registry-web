import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { getQueueItem } from '../../queues/_server/actions';
import QueueItemActions from './QueueItemActions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function QueueItemPage({ params }: Props) {
	const { id } = await params;
	const item = await getQueueItem(Number(id));

	if (!item) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Queue Item'
				queryKey={['mail-queue']}
				hideEdit
			/>
			<DetailsViewBody>
				<FieldView label='To'>{item.to}</FieldView>
				{item.cc && <FieldView label='CC'>{item.cc}</FieldView>}
				<FieldView label='Subject'>{item.subject}</FieldView>
				<FieldView label='Status'>
					<Badge
						variant='light'
						color={
							statusColors.mailQueueStatus[
								item.status as keyof typeof statusColors.mailQueueStatus
							] ?? 'gray'
						}
					>
						{item.status}
					</Badge>
				</FieldView>
				<FieldView label='Attempts'>
					{item.attempts} / {item.maxAttempts}
				</FieldView>
				{item.error && <FieldView label='Error'>{item.error}</FieldView>}
				<FieldView label='Trigger Type'>
					<Badge variant='light' color='gray'>
						{item.triggerType}
					</Badge>
				</FieldView>
				<FieldView label='Scheduled At'>
					{formatDateTime(item.scheduledAt)}
				</FieldView>
				<FieldView label='Created At'>
					{formatDateTime(item.createdAt)}
				</FieldView>
				<QueueItemActions id={item.id} status={item.status} />
			</DetailsViewBody>
		</DetailsView>
	);
}
