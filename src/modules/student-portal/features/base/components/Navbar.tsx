'use client';
import {
	Avatar,
	Container,
	Divider,
	Flex,
	Menu,
	useMantineColorScheme,
} from '@mantine/core';
import { IconLogout, IconMoon, IconSun, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import Logo from '@/shared/ui/Logo';

export default function Navbar() {
	const { student } = useUserStudent();
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();

	const handleLogout = () => {
		signOut({ callbackUrl: '/' });
	};

	return (
		<>
			<Container size='xl'>
				<Flex p={5} justify='space-between' align='center'>
					<Link href='/student-portal/student'>
						<Logo />
					</Link>
					<Menu shadow='md' width={200}>
						<Menu.Target>
							<Avatar
								alt={student?.name}
								size='md'
								style={{ cursor: 'pointer' }}
							>
								<IconUser size={14} />
							</Avatar>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Label>{student?.name}</Menu.Label>
							<Menu.Item
								leftSection={<IconUser size={14} />}
								component={Link}
								href='/student-portal/student/profile'
							>
								Profile
							</Menu.Item>
							<Menu.Item
								leftSection={
									colorScheme === 'dark' ? (
										<IconSun size={14} />
									) : (
										<IconMoon size={14} />
									)
								}
								onClick={() => toggleColorScheme()}
							>
								{colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
							</Menu.Item>
							<Menu.Divider />
							<Menu.Item
								leftSection={<IconLogout size={14} />}
								onClick={handleLogout}
								color='red'
							>
								Logout
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Flex>
			</Container>
			<Divider />
		</>
	);
}
