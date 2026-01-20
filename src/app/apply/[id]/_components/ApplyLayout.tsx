'use client';

import {
	Avatar,
	Box,
	Container,
	Menu,
	Text,
	UnstyledButton,
	useMantineColorScheme,
} from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

type Props = {
	applicantId: string;
	applicantName: string;
	children: React.ReactNode;
};

export default function ApplyLayout({
	applicantId,
	applicantName,
	children,
}: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<Header
				isDark={isDark}
				applicantId={applicantId}
				applicantName={applicantName}
			/>
			<Container size='lg' py='xl' pt={100}>
				{children}
			</Container>
		</Box>
	);
}

type HeaderProps = {
	isDark: boolean;
	applicantId: string;
	applicantName: string;
};

function Header({ isDark, applicantId, applicantName }: HeaderProps) {
	const initials = applicantName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<Box
			component='header'
			py='md'
			px='xl'
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				backgroundColor: isDark
					? 'var(--mantine-color-dark-7)'
					: 'var(--mantine-color-white)',
				borderBottom: `1px solid ${
					isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)'
				}`,
			}}
		>
			<Container size='lg'>
				<Box
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Text
						fw={700}
						size='lg'
						component={Link}
						href={`/apply/${applicantId}/documents`}
						style={{ textDecoration: 'none', color: 'inherit' }}
					>
						Limkokwing
					</Text>

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
										{applicantName}
									</Text>
									<Avatar size='sm' radius='xl' color='blue'>
										{initials}
									</Avatar>
								</Box>
							</UnstyledButton>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Item
								leftSection={<IconUser size={14} />}
								component={Link}
								href={`/apply/${applicantId}/profile`}
							>
								My Profile
							</Menu.Item>
							<Menu.Divider />
							<Menu.Item
								leftSection={<IconLogout size={14} />}
								color='red'
								onClick={() => signOut({ callbackUrl: '/' })}
							>
								Sign Out
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Box>
			</Container>
		</Box>
	);
}
