import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
} from '@/shared/ui/adease';
import DetailsContent from '../_components/DetailsContent';
import { deleteExternalLibrary, getExternalLibrary } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ExternalLibraryDetailsPage({ params }: Props) {
	const { id } = await params;
	const library = await getExternalLibrary(Number(id));

	if (!library) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='External Library'
				queryKey={['external-libraries']}
				handleDelete={async () => {
					'use server';
					await deleteExternalLibrary(Number(id));
				}}
			/>
			<DetailsViewBody>
				<DetailsContent library={library} />
			</DetailsViewBody>
		</DetailsView>
	);
}
