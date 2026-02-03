import { Container, Stack, Title } from '@mantine/core';
import AttendanceView from './_components/AttendanceView';

export default function AttendancePage() {
	return (
		<Container size='xl' p='lg'>
			<Stack gap='lg'>
				<Stack gap={4}>
					<Title order={3}>Attendance</Title>
				</Stack>
				<AttendanceView />
			</Stack>
		</Container>
	);
}
