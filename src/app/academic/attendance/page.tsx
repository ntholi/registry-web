import { Container, Stack } from '@mantine/core';
import AttendanceView from './_components/AttendanceView';

export default function AttendancePage() {
	return (
		<Container size='xl' p='lg'>
			<Stack gap='lg'>
				<AttendanceView />
			</Stack>
		</Container>
	);
}
