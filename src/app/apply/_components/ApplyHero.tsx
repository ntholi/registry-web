'use client';

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
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplicant } from '../_lib/useApplicant';

type ApplyButtonProps = {
	hasApplication: boolean;
	nextStepUrl: string;
	isSubmitted: boolean;
};

function ApplyButton({
	hasApplication,
	nextStepUrl,
	isSubmitted,
}: ApplyButtonProps) {
	if (hasApplication) {
		return (
			<Button
				component={Link}
				href={nextStepUrl}
				size='md'
				radius='xl'
				variant='gradient'
			>
				{isSubmitted ? 'View Application' : 'Continue Application'}
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
	const { status } = useSession();
	const isDark = colorScheme === 'dark';

	const { currentApplication, nextStepUrl, isLoading } = useApplicant();

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
						<ApplyButton
							hasApplication={!!currentApplication}
							nextStepUrl={nextStepUrl}
							isSubmitted={currentApplication?.status === 'submitted'}
						/>
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
