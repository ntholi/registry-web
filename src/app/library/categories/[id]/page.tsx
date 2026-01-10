import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteCategory, getCategory } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CategoryDetailsPage({ params }: Props) {
	const { id } = await params;
	const item = await getCategory(Number(id));

	if (!item) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Category'
				queryKey={['categories']}
				handleDelete={async () => {
					'use server';
					await deleteCategory(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Description'>{item.description}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
