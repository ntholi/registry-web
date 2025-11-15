import { Box } from '@mantine/core';
import { Form } from '@timetable/room-types';
import { getRoomType, updateRoomType } from '@timetable/room-types/server';
import { notFound } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function RoomTypeEdit({ params }: Props) {
	const { id } = await params;
	const roomType = await getRoomType(Number(id));

	if (!roomType) {
		return notFound();
	}

	return (
		<Box p='lg'>
			<Form
				title='Edit Room Type'
				defaultValues={roomType}
				onSubmit={async (value) => {
					'use server';
					const updated = await updateRoomType(Number(id), value);
					if (!updated) {
						throw new Error('Failed to update room type');
					}
					return updated;
				}}
			/>
		</Box>
	);
}
