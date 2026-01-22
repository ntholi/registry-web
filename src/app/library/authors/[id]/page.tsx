import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteAuthor, getAuthor } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function AuthorDetailsPage({ params }: Props) {
	const { id } = await params;
	const item = await getAuthor(id);

	if (!item) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Author'
				queryKey={['authors']}
				handleDelete={async () => {
					'use server';
					await deleteAuthor(id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
