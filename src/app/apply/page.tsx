'use client';

import {
	Box,
	Button,
	Container,
	Group,
	Stack,
	Text,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import { IconArrowRight, IconBooks } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ApplyPage() {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	return (
		<Box
			style={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<Header isDark={isDark} />
			<HeroSection />
			<Footer />
		</Box>
	);
}

interface HeaderProps {
	isDark: boolean;
}

function Header({ isDark }: HeaderProps) {
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
				backdropFilter: 'blur(10px)',
				backgroundColor: isDark
					? 'rgba(26, 27, 30, 0.8)'
					: 'rgba(255, 255, 255, 0.8)',
			}}
		>
			<Container size='xl'>
				<Group justify='space-between'>
					<Image
						src={isDark ? '/images/logo-dark.png' : '/images/logo-light.png'}
						alt='Limkokwing University'
						width={140}
						height={35}
						style={{ objectFit: 'contain' }}
						priority
					/>
					<Button
						component={Link}
						href='/auth/login'
						variant='subtle'
						size='sm'
					>
						Sign In
					</Button>
				</Group>
			</Container>
		</Box>
	);
}

function HeroSection() {
	return (
		<Container
			size='lg'
			style={{
				flex: 1,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				paddingTop: 80,
				paddingBottom: 80,
			}}
		>
			<Stack gap={50} align='center' ta='center'>
				<Stack gap='lg' align='center'>
					<Text
						size='sm'
						fw={600}
						c='dimmed'
						tt='uppercase'
						style={{ letterSpacing: 3 }}
					>
						Limkokwing University of Creative Technology
					</Text>

					<Title
						order={1}
						fz={{ base: 48, sm: 64, md: 80 }}
						fw={800}
						lh={1.1}
						style={{
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Be the most
						<br />
						successful
					</Title>

					<Text size='lg' c='dimmed' maw={500} lh={1.6} mt='md'>
						Transform your passion into a career. Join a global community of
						creative innovators and industry leaders.
					</Text>
				</Stack>

				<Group gap='lg' justify='center'>
					<Button
						component={Link}
						href='/apply/new'
						size='xl'
						radius='xl'
						rightSection={<IconArrowRight size={20} />}
						variant='gradient'
						gradient={{ from: 'violet', to: 'grape', deg: 135 }}
						styles={{
							root: {
								paddingInline: 40,
								fontWeight: 600,
							},
						}}
					>
						Apply Now
					</Button>

					<Button
						component={Link}
						href='/apply/courses'
						size='xl'
						radius='xl'
						variant='default'
						leftSection={<IconBooks size={20} />}
						styles={{
							root: {
								paddingInline: 40,
								fontWeight: 600,
							},
						}}
					>
						Browse Courses
					</Button>
				</Group>
			</Stack>
		</Container>
	);
}

function Footer() {
	return (
		<Box
			component='footer'
			py='xl'
			style={{
				borderTop: '1px solid var(--mantine-color-default-border)',
			}}
		>
			<Container size='xl'>
				<Text size='sm' c='dimmed' ta='center'>
					© {new Date().getFullYear()} Limkokwing University of Creative
					Technology, Lesotho. All rights reserved.
				</Text>
			</Container>
		</Box>
	);
}
