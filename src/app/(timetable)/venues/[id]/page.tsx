import { Badge, Group, SimpleGrid } from '@mantine/core';
import { deleteVenue, getVenueWithRelations } from '@timetable/venues';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function VenueDetails({ params }: Props) {
	const { id } = await params;
	const venue = await getVenueWithRelations(Number(id));

	if (!venue) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Venue'
				queryKey={['venues']}
				handleDelete={async () => {
					'use server';
					await deleteVenue(Number(id));
				}}
			/>
			<DetailsViewBody>
				<SimpleGrid cols={2}>
					<FieldView label='Name'>{venue.name}</FieldView>
					<FieldView label='Type'>{venue.type.name}</FieldView>
				</SimpleGrid>
				<FieldView label='Capacity'>{venue.capacity}</FieldView>
				<FieldView label='Schools'>
					<Group gap='xs'>
						{venue.venueSchools.map((vs) => (
							<Badge variant='light' key={vs.school.id}>
								{vs.school.code}
							</Badge>
						))}
					</Group>
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
