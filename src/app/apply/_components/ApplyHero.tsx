import {
	Button,
	Container,
	Group,
	Stack,
	Text,
	useMantineColorScheme,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
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
					<Button
						component={Link}
						href='/apply/new'
						size='md'
						radius='xl'
						rightSection={<IconArrowRight size={20} />}
						variant='gradient'
					>
						Apply Now
					</Button>

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
