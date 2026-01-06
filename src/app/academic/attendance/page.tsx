import { Container, Title } from '@mantine/core';
import AttendanceView from './_components/AttendanceView';

export default function AttendancePage() {
	return (
		<Container size='xl' py='md'>
			<Title order={2} mb='lg'>
				Attendance
			</Title>
			<AttendanceView />
		</Container>
	);
}
