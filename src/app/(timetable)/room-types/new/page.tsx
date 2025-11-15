import { Box } from '@mantine/core';
import { Form } from '@timetable/room-types';
import { createRoomType } from '@timetable/room-types/server';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Room Type' onSubmit={createRoomType} />
		</Box>
	);
}
