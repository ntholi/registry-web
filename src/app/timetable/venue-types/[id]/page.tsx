import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteVenueType, getVenueType } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function VenueTypeDetails({ params }: Props) {
	const { id } = await params;
	const venueType = await getVenueType(id);

	if (!venueType) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Venue Type'
				queryKey={['venue-types']}
				handleDelete={async () => {
					'use server';
					await deleteVenueType(id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{venueType.name}</FieldView>
				{venueType.description && (
					<FieldView label='Description'>{venueType.description}</FieldView>
				)}
			</DetailsViewBody>
		</DetailsView>
	);
}
