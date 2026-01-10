import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	getBookCopyStatusColor,
	getConditionColor,
} from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { getBookCopy, withdrawBookCopy } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookCopyDetailsPage({ params }: Props) {
	const { id } = await params;
	const copy = await getBookCopy(Number(id));

	if (!copy) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Book Copy'
				queryKey={['book-copies']}
				handleDelete={
					copy.status === 'Available'
						? async () => {
								'use server';
								await withdrawBookCopy(Number(id));
							}
						: undefined
				}
			/>
			<DetailsViewBody>
				<FieldView label='Book'>{copy.book.title}</FieldView>
				<FieldView label='Serial Number'>{copy.serialNumber}</FieldView>
				<FieldView label='Condition'>
					<Badge color={getConditionColor(copy.condition)}>
						{copy.condition}
					</Badge>
				</FieldView>
				<FieldView label='Status'>
					<Badge color={getBookCopyStatusColor(copy.status)}>
						{copy.status}
					</Badge>
				</FieldView>
				<FieldView label='Location'>{copy.location}</FieldView>
				<FieldView label='Acquired Date'>
					{copy.acquiredAt && formatDate(copy.acquiredAt)}
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
