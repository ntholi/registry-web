'use client';

import type { ApplicationProgress } from '@admissions/applicants';
import { getCurrentUserApplicationProgress } from '@admissions/applicants';
import {
	Button,
	Container,
	Group,
	Skeleton,
	Stack,
	Text,
	useMantineColorScheme,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

function ApplyButton({ progress }: { progress?: ApplicationProgress }) {
	if (!progress) {
		return (
			<Button
				component={Link}
				href='/apply/welcome'
				size='md'
				radius='xl'
				rightSection={<IconArrowRight size={20} />}
				variant='gradient'
			>
				Apply Now
			</Button>
		);
	}

	if (progress.hasApplication) {
		return (
			<Button
				component={Link}
				href={progress.nextStepUrl}
				size='md'
				radius='xl'
				variant='gradient'
			>
				My Application
			</Button>
		);
	}

	return (
		<Button
			component={Link}
			href='/apply/welcome'
			size='md'
			radius='xl'
			rightSection={<IconArrowRight size={20} />}
			variant='gradient'
		>
			Apply Now
		</Button>
	);
}

export default function HeroSection() {
	const { colorScheme } = useMantineColorScheme();
	const { data: session, status } = useSession();
	const isDark = colorScheme === 'dark';

	const { data: progress, isLoading } = useQuery({
		queryKey: ['application-progress', session?.user?.id],
		queryFn: getCurrentUserApplicationProgress,
		enabled: status === 'authenticated',
		staleTime: 30_000,
	});

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
					<Image
						src={isDark ? '/images/logo-dark.png' : '/images/logo-light.png'}
						alt='Limkokwing University'
						width={280}
						height={70}
						style={{ objectFit: 'contain' }}
						priority
					/>

					<Text
						component='h1'
						fz={{ base: 48, sm: 64, md: 80 }}
						fw={800}
						lh={1.1}
						ta='center'
						tt={'uppercase'}
					>
						Be the most
						<br />
						successful
					</Text>

					<Text size='lg' c='dimmed' maw={500} lh={1.6} mt='md'>
						Transform your passion into a career. Join a global community of
						creative innovators and industry leaders.
					</Text>
				</Stack>

				<Group gap='lg' justify='center'>
					{isLoading && status === 'authenticated' ? (
						<Skeleton height={42} width={150} radius='xl' />
					) : (
						<ApplyButton progress={progress} />
					)}

					<Button
						component={Link}
						href='/apply/courses'
						size='md'
						radius='xl'
						variant='default'
					>
						Browse Courses
					</Button>
				</Group>
			</Stack>
		</Container>
	);
}
