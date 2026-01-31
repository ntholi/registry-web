import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import {
	deleteRecognizedSchool,
	getRecognizedSchool,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function RecognizedSchoolDetails({ params }: Props) {
	const { id } = await params;
	const item = await getRecognizedSchool(id);

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Recognized School'
				queryKey={['recognized-schools']}
				handleDelete={async () => {
					'use server';
					await deleteRecognizedSchool(id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Status'>
					{item.isActive ? 'Active' : 'Inactive'}
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
