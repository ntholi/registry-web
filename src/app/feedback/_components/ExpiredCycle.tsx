import { Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCalendarOff } from '@tabler/icons-react';

type Props = {
	cycleName: string;
	endDate: string;
};

export default function ExpiredCycle({ cycleName, endDate }: Props) {
	return (
		<Container size='xs' py='xl'>
			<Stack align='center' gap='lg' ta='center'>
				<ThemeIcon size={80} radius='xl' color='orange' variant='light'>
					<IconCalendarOff size={48} />
				</ThemeIcon>

				<Title order={2}>This feedback cycle has ended</Title>

				<Text c='dimmed'>
					{cycleName} ended on {endDate}
				</Text>

				<Text size='sm' c='dimmed'>
					If you believe this is an error, please contact your class
					representative.
				</Text>
			</Stack>
		</Container>
	);
}
