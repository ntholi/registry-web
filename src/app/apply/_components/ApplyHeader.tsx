'use client';

import {
	Avatar,
	Box,
	Button,
	Container,
	Image,
	Menu,
	Text,
	UnstyledButton,
	useMantineColorScheme,
} from '@mantine/core';
import { IconFileText, IconLogout } from '@tabler/icons-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useApplicant } from '../_lib/useApplicant';

export default function ApplyHeader() {
	const { applicant } = useApplicant();
	const applicantId = applicant?.id;
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const { data: session, status } = useSession();

	const isAuthenticated = status === 'authenticated' && session?.user;
	const user = session?.user;
	const name = user?.name ?? 'User';
	const initials = name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<Box
			component='header'
			py='sm'
			px='xl'
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				backdropFilter: 'blur(10px)',
				backgroundColor: isDark
					? 'rgba(26, 27, 30, 0.8)'
					: 'rgba(255, 255, 255, 0.8)',
				borderBottom: `1px solid ${
					isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)'
				}`,
			}}
		>
			<Container size='xl'>
				<Box
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Link
						href={'/apply'}
						style={{ display: 'flex', alignItems: 'center' }}
					>
						<Image
							src={isDark ? '/images/logo-dark.png' : '/images/logo-light.png'}
							alt='Limkokwing University'
							component={NextImage}
							h={40}
							w={'auto'}
							width={160}
							height={40}
							style={{ objectFit: 'contain' }}
							priority
						/>
					</Link>

					{isAuthenticated ? (
						<Menu shadow='md' width={200} position='bottom-end'>
							<Menu.Target>
								<UnstyledButton>
									<Box
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
										}}
									>
										<Text size='sm' c='dimmed'>
											{name}
										</Text>
										<Avatar
											size='sm'
											radius='xl'
											color='blue'
											src={user?.image}
										>
											{initials}
										</Avatar>
									</Box>
								</UnstyledButton>
							</Menu.Target>

							<Menu.Dropdown>
								{applicantId && (
									<>
										<Menu.Item
											leftSection={<IconFileText size={14} />}
											component={Link}
											href='/apply/my-applications'
										>
											My Applications
										</Menu.Item>
										<Menu.Divider />
									</>
								)}
								<Menu.Item
									leftSection={<IconLogout size={14} />}
									color='red'
									onClick={() => signOut({ callbackUrl: '/' })}
								>
									Sign Out
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					) : (
						<Button
							component={Link}
							href='/auth/login'
							variant='subtle'
							color='gray'
							size='sm'
						>
							Sign In
						</Button>
					)}
				</Box>
			</Container>
		</Box>
	);
}
