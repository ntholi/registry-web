import { Box } from '@mantine/core';
import { createRoom, Form } from '@timetable/rooms';

export default async function NewPage() {
	return (
		<Box p='lg'>
			<Form
				title='Create Room'
				onSubmit={async (value) => {
					'use server';
					const { schoolIds, ...room } = value;
					return await createRoom(room, schoolIds ?? []);
				}}
			/>
		</Box>
	);
}
