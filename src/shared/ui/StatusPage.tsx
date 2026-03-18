'use client';

import {
	Button,
	Center,
	Container,
	Group,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';

export interface StatusPageProps {
	title: string;
	description?: string;
	icon?: React.ReactNode;
	color?: string;
	primaryActionHref?: string;
	primaryActionLabel?: string;
	onRetry?: () => void;
	showBack?: boolean;
	showHome?: boolean;
}

export default function StatusPage({
	title,
	description,
	icon,
	color = 'blue',
	primaryActionHref = '/',
	primaryActionLabel = 'Go to Home',
	onRetry,
	showBack = true,
	showHome = false,
}: StatusPageProps) {
	const router = useRouter();

	return (
		<Center h='100dvh'>
			<Container size='xs'>
				<Stack align='center' gap='md'>
					{icon ? (
						<ThemeIcon size={64} radius='xl' variant='light' color={color}>
							{icon}
						</ThemeIcon>
					) : null}
					<Title order={1} ta='center' size='h2'>
						{title}
					</Title>
					{description ? (
						<Text c='dimmed' ta='center'>
							{description}
						</Text>
					) : null}
					<Group mt='sm'>
						{showBack ? (
							<Button
								variant='light'
								color={color}
								leftSection={<IconArrowLeft size='1.2rem' />}
								onClick={() => router.back()}
							>
								Go back
							</Button>
						) : null}
						{onRetry ? (
							<Button variant='light' color={color} onClick={onRetry}>
								Try again
							</Button>
						) : null}
						{showHome ? (
							<Button component={Link} href={primaryActionHref} color={color}>
								{primaryActionLabel}
							</Button>
						) : null}
					</Group>
				</Stack>
			</Container>
		</Center>
	);
}
