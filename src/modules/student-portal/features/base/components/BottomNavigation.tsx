'use client';
import {
	ActionIcon,
	Group,
	Paper,
	Stack,
	Text,
	useMantineColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
	IconClipboardCheck,
	IconFileCertificate,
	IconHome,
	IconUser,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';

interface NavItem {
	icon: React.ReactNode;
	label: string;
	href: string;
	path: string;
}

const navItems: NavItem[] = [
	{
		icon: <IconHome size={20} />,
		label: 'Home',
		href: '/student-portal/student',
		path: '/student-portal/student',
	},
	{
		icon: <IconClipboardCheck size={20} />,
		label: 'Registration',
		href: '/student-portal/student/registration',
		path: '/student-portal/student/registration',
	},
	{
		icon: <IconFileCertificate size={20} />,
		label: 'Transcript',
		href: '/student-portal/student/transcripts',
		path: '/student-portal/student/transcripts',
	},
	{
		icon: <IconUser size={20} />,
		label: 'Profile',
		href: '/student-portal/student/profile',
		path: '/student-portal/student/profile',
	},
];

export default function BottomNavigation() {
	const router = useRouter();
	const pathname = usePathname();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	const handleNavigation = (href: string) => {
		router.push(href);
	};

	const isActive = (path: string) => {
		if (path === '/student-portal/student') {
			return pathname === path;
		}
		return pathname.startsWith(path);
	};

	if (!isMobile) {
		return null;
	}

	return (
		<Paper
			shadow='lg'
			style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 1000,
				borderTop: `1px solid var(--mantine-color-${isDark ? 'dark-4' : 'gray-3'})`,
				borderRadius: 0,
				paddingBottom: 'env(safe-area-inset-bottom, 0px)',
			}}
			p='xs'
			pb='calc(var(--mantine-spacing-xs) + env(safe-area-inset-bottom, 0px))'
		>
			<Group justify='space-around' gap={0}>
				{navItems.map((item) => {
					const active = isActive(item.path);
					return (
						<Stack
							key={item.path}
							align='center'
							gap='4px'
							style={{
								cursor: 'pointer',
								flex: 1,
								minHeight: '60px',
								justifyContent: 'center',
							}}
							onClick={() => handleNavigation(item.href)}
						>
							<ActionIcon
								variant={active ? 'filled' : 'transparent'}
								color={active ? 'blue' : 'dimmed'}
								size='lg'
							>
								{item.icon}
							</ActionIcon>
							<Text size='xs' c={active ? 'blue' : 'dimmed'} ta='center'>
								{item.label}
							</Text>
						</Stack>
					);
				})}
			</Group>
		</Paper>
	);
}
