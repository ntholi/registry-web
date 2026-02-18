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

export default async function CategoryDetails({ params }: Props) {
	const { id } = await params;
	const category = await getCategory(Number(id));

	if (!category) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Category'
				queryKey={['feedback-categories']}
				handleDelete={async () => {
					'use server';
					await deleteCategory(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{category.name}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
