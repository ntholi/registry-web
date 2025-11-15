import { Badge, Group, SimpleGrid } from '@mantine/core';
import { deleteRoom, getRoomWithRelations } from '@timetable/rooms';
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

export default async function RoomDetails({ params }: Props) {
	const { id } = await params;
	const room = await getRoomWithRelations(Number(id));

	if (!room) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Room'
				queryKey={['rooms']}
				handleDelete={async () => {
					'use server';
					await deleteRoom(Number(id));
				}}
			/>
			<DetailsViewBody>
				<SimpleGrid cols={2}>
					<FieldView label='Name'>{room.name}</FieldView>
					<FieldView label='Type'>{room.type.name}</FieldView>
				</SimpleGrid>
				<FieldView label='Capacity'>{room.capacity}</FieldView>
				<FieldView label='Schools'>
					<Group gap='xs'>
						{room.roomSchools.map((rs) => (
							<Badge variant='light' key={rs.school.id}>
								{rs.school.code}
							</Badge>
						))}
					</Group>
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
