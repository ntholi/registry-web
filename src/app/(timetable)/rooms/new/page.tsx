import { Box } from '@mantine/core';
import { Form } from '@timetable/rooms';
import { createRoom } from '@timetable/rooms/server';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Room'
				onSubmit={async (value) => {
					'use server';
					const { schoolIds, ...room } = value;
					return await createRoom(room, schoolIds);
				}}
			/>
		</Box>
	);
}
