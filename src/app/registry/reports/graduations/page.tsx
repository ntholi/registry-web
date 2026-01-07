import {
	Card,
	Container,
	Grid,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconCertificate } from '@tabler/icons-react';
import Link from '@/shared/ui/Link';

export default function GraduationReportsPage() {
	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Stack gap='xs'>
					<Title order={1} size='h2'>
						Graduation Reports
					</Title>
					<Text c='dimmed' size='sm'>
						Select a report type to view graduation data
					</Text>
				</Stack>

				<Grid gutter='md' mt='md'>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<Link href='/registry/reports/graduations/student-graduations'>
							<Card
								withBorder
								p='lg'
								style={{ cursor: 'pointer', height: '100%' }}
								className='hover-card'
							>
								<Stack gap='md'>
									<Group>
										<IconCertificate
											size={32}
											style={{ color: 'var(--mantine-color-blue-6)' }}
										/>
									</Group>
									<Stack gap='xs'>
										<Text fw={600} size='lg'>
											Student Graduations
										</Text>
										<Text size='sm' c='dimmed'>
											View and export graduation data by graduation date,
											school, and program
										</Text>
									</Stack>
								</Stack>
							</Card>
						</Link>
					</Grid.Col>
				</Grid>
			</Stack>
		</Container>
	);
}
