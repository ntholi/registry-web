import {
	Box,
	Button,
	Center,
	Container,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/core/auth';
import { dashboardUsers } from '@/core/database';
import GoogleSignInForm from '@/shared/ui/GoogleSignInForm';
import Logo from '@/shared/ui/Logo';

export default async function HomePage() {
	const session = await auth();

	async function signInForApply() {
		'use server';
		await signIn('google', { redirectTo: '/apply/new' });
	}

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
								<Logo height={130} />
								<Stack align='center' gap='xs'>
									<Title order={2} size='h1' fw={100} ta='center'>
										Login
									</Title>
								</Stack>
							</Stack>

							<Stack w='100%' gap='lg'>
								<GoogleSignInForm />

								<Divider label='New Applicant?' labelPosition='center' />

								<Stack gap='md' align='center'>
									<Text size='sm' c='dimmed' ta='center'>
										If you're a new applicant looking to join Limkokwing
										University, you can start your application here.
									</Text>
									<Box component='form' w={'100%'} action={signInForApply}>
										<Button
											type='submit'
											variant='gradient'
											rightSection={<IconArrowRight size={18} />}
											fullWidth
										>
											Apply Now
										</Button>
									</Box>
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
											style={{
												textDecoration: 'none',
												fontWeight: 500,
											}}
										>
											Contact Registry
										</Text>
									</Group>
									<Text size='xs' c='dimmed' ta='center'>
										Limkokwing University of Creative Technology, Lesotho
									</Text>
								</Stack>
							</Stack>
						</Stack>
					</Paper>
				</Center>
			</Container>
		</Box>
	);
}
