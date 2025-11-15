import { deleteRoomType, getRoomType } from '@timetable/room-types';
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

export default async function RoomTypeDetails({ params }: Props) {
	const { id } = await params;
	const roomType = await getRoomType(Number(id));

	if (!roomType) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Room Type'
				queryKey={['room-types']}
				handleDelete={async () => {
					'use server';
					await deleteRoomType(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{roomType.name}</FieldView>
				<FieldView label='Description'>{roomType.description}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
