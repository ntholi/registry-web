import { Container, Stack, Text, Title } from '@mantine/core';
import AttendanceView from './_components/AttendanceView';

export default function AttendancePage() {
	return (
		<Container size='xl' py='md'>
			<Stack gap='lg'>
				<Stack gap={4}>
					<Title order={2}>Attendance</Title>
					<Text c='dimmed'>
						Select a module and week to mark attendance or review summaries.
					</Text>
				</Stack>
				<AttendanceView />
			</Stack>
		</Container>
	);
}
