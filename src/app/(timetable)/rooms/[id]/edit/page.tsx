import { Box } from '@mantine/core';
import { Form } from '@timetable/rooms';
import { getRoomWithRelations, updateRoom } from '@timetable/rooms/server';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function RoomEdit({ params }: Props) {
	const { id } = await params;
	const room = await getRoomWithRelations(Number(id));

	if (!room) {
		return notFound();
	}

	const schoolIds = room.roomSchools.map(
		(rs: { school: { id: number } }) => rs.school.id
	);

	return (
		<Box p='lg'>
			<Form
				title='Edit Room'
				defaultValues={{
					...room,
					schoolIds,
				}}
				onSubmit={async (value) => {
					'use server';
					const { schoolIds, ...roomData } = value;
					const updated = await updateRoom(Number(id), roomData, schoolIds);
					if (!updated) {
						throw new Error('Failed to update room');
					}
					return updated;
				}}
			/>
		</Box>
	);
}
