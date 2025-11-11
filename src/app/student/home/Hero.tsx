'use client';
import {
	Avatar,
	Divider,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBook, IconTrophy, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import useUserStudent from '@/lib/hooks/use-user-student';
import { formatSemester } from '@/lib/utils/utils';
import { getStudentPhoto } from '@/server/students/actions';
import { studentColors } from '../utils/colors';
import HeroSkeleton from './HeroSkeleton';

export default function Hero() {
	const { student, program, semester, remarks, isLoading } = useUserStudent();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const { data: photoUrl } = useQuery({
		queryKey: ['studentPhoto', student?.stdNo],
		queryFn: () => getStudentPhoto(student?.stdNo),
		staleTime: 1000 * 60 * 10,
	});

	if (isLoading) {
		return <HeroSkeleton isMobile={isMobile} />;
	}

	return (
		<Paper shadow='sm' p='xl' radius='md' withBorder>
			<Stack gap='lg'>
				<Group gap='lg'>
					<Avatar
						size={70}
						radius='sm'
						src={photoUrl}
						color={studentColors.theme.primary}
						variant='filled'
					>
						{!photoUrl && <IconUser size='1.8rem' />}
					</Avatar>
					<Stack gap={4} flex={1}>
						<Title order={2} size='h3' fw={600} lh={1.2}>
							{student?.name}
						</Title>
						<Text size='sm' c='dimmed' mt={'xs'} fw={500}>
							{student?.stdNo}
						</Text>
					</Stack>
				</Group>

				<Divider />

				<Stack gap='xl'>
					<Group justify='space-between'>
						<Stack gap={2}>
							<Text fw={500}>{program?.name}</Text>
							<Text size='xs' c='dimmed'>
								{semester?.structureSemester?.semesterNumber
									? formatSemester(semester.structureSemester.semesterNumber)
									: 'N/A'}
							</Text>
						</Stack>
					</Group>

					<Grid gutter='xl'>
						<Grid.Col span={{ base: 6 }}>
							<Stack gap='xs' align='center'>
								{!isMobile && (
									<ThemeIcon
										size={'xl'}
										variant='light'
										color={studentColors.theme.secondary}
										radius='md'
									>
										<IconTrophy size='1.2rem' />
									</ThemeIcon>
								)}

								<Text size='xs' c='dimmed' ta='center'>
									CGPA
								</Text>
								<Text fw={700} size='1.8rem'>
									{remarks.latestPoints.cgpa.toFixed(2)}
								</Text>
							</Stack>
						</Grid.Col>

						<Grid.Col span={{ base: 6 }}>
							<Stack gap='xs' align='center'>
								{!isMobile && (
									<ThemeIcon
										size={'xl'}
										variant='light'
										color={studentColors.theme.accent}
										radius='md'
									>
										<IconBook size='1.2rem' />
									</ThemeIcon>
								)}

								<Text size='xs' c='dimmed' ta='center'>
									Credits
								</Text>
								<Text fw={700} size='1.8rem'>
									{remarks.totalCreditsCompleted}
								</Text>
							</Stack>
						</Grid.Col>
					</Grid>
				</Stack>
			</Stack>
		</Paper>
	);
}
