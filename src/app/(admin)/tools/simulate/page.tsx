import {
	Box,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconTestPipe } from '@tabler/icons-react';
import RegistrationSimulator from '@/modules/admin/features/tools/simulate/components/RegistrationSimulator';

export default function SimulatePage() {
	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group gap='xs' align='center'>
							<ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
								<IconTestPipe size={24} />
							</ThemeIcon>
							<Box>
								<Title fw={400} size='h4'>
									Registration Simulator
								</Title>
								<Text size='sm' c='dimmed'>
									A tool for testing student registration process
								</Text>
							</Box>
						</Group>
						<RegistrationSimulator />
					</Stack>
				</Paper>
			</Stack>
		</Container>
	);
}
