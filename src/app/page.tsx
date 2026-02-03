import {
	Box,
	Center,
	Container,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowRight, IconLogin } from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import { dashboardUsers } from '@/core/database';
import ButtonLink from '@/shared/ui/ButtonLink';
import Logo from '@/shared/ui/Logo';

export default async function HomePage() {
	const session = await auth();

	if (session?.user) {
		const role = session.user.role;

		if (role === 'student') {
			redirect('/student-portal');
		} else if (role === 'applicant') {
			redirect('/apply');
		} else if (role !== 'user' && dashboardUsers.enumValues.includes(role)) {
			redirect('/dashboard');
		} else {
			redirect('/auth/account-setup');
		}
	}

	return (
		<Box
			style={{
				minHeight: '100vh',
				background:
					'light-dark(linear-gradient(135deg, var(--mantine-color-blue-1) 0%, var(--mantine-color-indigo-1) 100%), linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-6) 100%))',
			}}
		>
			<Container size='sm' pt='3.75rem' pb='2.5rem'>
				<Center mih='80vh'>
					<Paper
						shadow='xl'
						p='2.5rem'
						w='100%'
						maw='26.25rem'
						withBorder
						bg='light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))'
						style={{
							backdropFilter: 'blur(10px)',
							borderColor:
								'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
						}}
					>
						<Stack align='center' gap='xl'>
							<Stack align='center' gap='md'>
								<Logo height={100} />
								<Stack align='center' gap='xs'>
									<Title order={1} size='h2' fw={600} ta='center'>
										Registry Portal
									</Title>
									<Text c='dimmed' ta='center' size='sm'>
										University student registration and administration system
									</Text>
								</Stack>
							</Stack>

							<Stack w='100%' gap='md'>
								<ButtonLink
									href='/auth/login'
									leftSection={<IconLogin size={18} />}
									fullWidth
								>
									Sign In
								</ButtonLink>
							</Stack>

							<Divider w='100%' label='New Applicant?' labelPosition='center' />

							<Stack w='100%' gap='md' align='center'>
								<Text size='sm' c='dimmed' ta='center'>
									If you're a new applicant looking to join Limkokwing
									University, you can start your application here.
								</Text>
								<ButtonLink
									href='/apply'
									variant='light'
									rightSection={<IconArrowRight size={18} />}
									fullWidth
								>
									Apply Now
								</ButtonLink>
							</Stack>

							<Stack gap='xs' mt='lg'>
								<Group justify='center' gap='xs'>
									<Text size='xs' c='dimmed'>
										Need assistance?
									</Text>
									<Text
										size='xs'
										c='blue'
										component='a'
										href='mailto:registry@limkokwing.ac.ls'
										td='underline'
										fw={500}
									>
										Contact Registry
									</Text>
								</Group>
								<Text size='xs' c='dimmed' ta='center'>
									Limkokwing University of Creative Technology, Lesotho
								</Text>
							</Stack>
						</Stack>
					</Paper>
				</Center>
			</Container>
		</Box>
	);
}
