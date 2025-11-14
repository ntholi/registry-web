import { Box } from '@mantine/core';
import { createRoomType, Form } from '@timetable/room-types';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form title='Create Room Type' onSubmit={createRoomType} />
		</Box>
	);
}
