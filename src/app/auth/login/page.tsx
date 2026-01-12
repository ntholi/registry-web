import {
	Box,
	Button,
	Center,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/core/auth';
import Logo from '@/shared/ui/Logo';

async function handleGoogleSignIn(redirectTo: string) {
	'use server';
	await signIn('google', { redirectTo });
}

interface Props {
	searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
	const { callbackUrl } = await searchParams;
	const session = await auth();

	if (session?.user) {
		const role = session.user.role;
		if (callbackUrl) {
			redirect(callbackUrl);
		}
		if (role === 'student') {
			redirect('/student-portal');
		} else if (
			[
				'admin',
				'academic',
				'finance',
				'registry',
				'library',
				'resource',
			].includes(role)
		) {
			redirect('/dashboard');
		} else {
			redirect('/');
		}
	}

	const signInAction = handleGoogleSignIn.bind(null, callbackUrl || '/');

	return (
		<Box
			style={{
				minHeight: '100vh',
				background:
					'light-dark(linear-gradient(135deg, var(--mantine-color-blue-1) 0%, var(--mantine-color-indigo-1) 100%), linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-6) 100%))',
			}}
		>
			<Container size='sm' pt='3.75rem' pb='2.5rem'>
				<Center>
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
								<form action={signInAction}>
									<Button
										type='submit'
										variant='default'
										leftSection={
											<Image
												src='/images/google.svg'
												alt='Google'
												width={18}
												height={18}
											/>
										}
										fullWidth
									>
										Sign in with Google
									</Button>
								</form>

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
