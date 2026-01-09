import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteSubject, getSubject } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SubjectDetails({ params }: Props) {
	const { id } = await params;
	const item = await getSubject(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Subject'
				queryKey={['subjects']}
				handleDelete={async () => {
					'use server';
					await deleteSubject(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Status'>
					<Badge color={item.isActive ? 'green' : 'gray'}>
						{item.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
