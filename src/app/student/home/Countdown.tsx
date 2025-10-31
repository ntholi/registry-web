'use client';
import { Badge, Box, Divider, Grid, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';
import { formatSemester } from '@/lib/utils';

type TimeLeft = {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
};

export default function Countdown({ targetDate }: { targetDate: number }) {
	const { currentTerm } = useCurrentTerm();
	const { student, program, semester, isLoading } = useUserStudent();
	const [timeLeft, setTimeLeft] = useState<TimeLeft>({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		const timer = setInterval(() => {
			const now = Date.now();
			const difference = targetDate - now;

			if (difference > 0) {
				const days = Math.floor(difference / (1000 * 60 * 60 * 24));
				const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((difference % (1000 * 60)) / 1000);

				setTimeLeft({ days, hours, minutes, seconds });
			} else {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	if (isLoading) {
		return (
			<Stack gap='xl'>
				<Paper shadow='sm' p='xl' radius='lg' withBorder>
					<Stack gap='lg' align='center'>
						<Skeleton height={40} width={300} radius='md' />
						<Skeleton height={20} width={150} radius='md' />
						<Skeleton height={20} width={250} radius='md' />
						<Skeleton height={20} width={100} radius='md' />
					</Stack>
				</Paper>
				<Paper shadow='sm' p='xl' radius='lg' withBorder>
					<Stack gap='lg' align='center'>
						<Skeleton height={30} width={200} radius='md' />
						<Grid gutter='lg' justify='center'>
							{[1, 2, 3, 4].map((i) => (
								<Grid.Col key={i} span={{ base: 6, sm: 3 }}>
									<Skeleton height={100} radius='md' />
								</Grid.Col>
							))}
						</Grid>
					</Stack>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='xl'>
			<Paper shadow='md' p='xl' withBorder>
				<Stack gap='lg' align='center'>
					<Stack gap='sm' align='center'>
						<Title order={1} size='h1' ta='center'>
							{student?.name}
						</Title>
						<Badge size='lg' variant='light' color='blue' radius='md'>
							{student?.stdNo}
						</Badge>
					</Stack>

					<Divider w='100%' />

					<Stack gap='xs' align='center'>
						<Box ta='center'>
							<Text size='lg' fw={600} c='dimmed'>
								{program?.name}
							</Text>
							<Text size='md' c='dimmed' mt={4}>
								{formatSemester(semester?.semesterNumber)}
							</Text>
						</Box>
					</Stack>
				</Stack>
			</Paper>

			<Paper shadow='md' p='xl' withBorder>
				<Stack gap='xl' align='center'>
					<Box ta='center'>
						<Text size='md' c='dimmed' mt='xs'>
							Time remaining until registration opens for{' '}
							<Text span c='white'>
								{currentTerm?.name}
							</Text>{' '}
							semester
						</Text>
					</Box>

					<Grid gutter='xl' justify='center' w='100%'>
						<Grid.Col span={{ base: 6, sm: 3 }}>
							<Paper shadow='sm' p='lg' withBorder>
								<Stack gap='xs' align='center'>
									<Text size='3rem' fw={900} c='blue' lh={1}>
										{timeLeft.days.toString().padStart(2, '0')}
									</Text>
									<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
										Days
									</Text>
								</Stack>
							</Paper>
						</Grid.Col>

						<Grid.Col span={{ base: 6, sm: 3 }}>
							<Paper shadow='sm' p='lg' withBorder>
								<Stack gap='xs' align='center'>
									<Text size='3rem' fw={900} c='green' lh={1}>
										{timeLeft.hours.toString().padStart(2, '0')}
									</Text>
									<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
										Hours
									</Text>
								</Stack>
							</Paper>
						</Grid.Col>

						<Grid.Col span={{ base: 6, sm: 3 }}>
							<Paper shadow='sm' p='lg' withBorder>
								<Stack gap='xs' align='center'>
									<Text size='3rem' fw={900} c='orange' lh={1}>
										{timeLeft.minutes.toString().padStart(2, '0')}
									</Text>
									<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
										Minutes
									</Text>
								</Stack>
							</Paper>
						</Grid.Col>

						<Grid.Col span={{ base: 6, sm: 3 }}>
							<Paper shadow='sm' p='lg' withBorder>
								<Stack gap='xs' align='center'>
									<Text size='3rem' fw={900} c='red' lh={1}>
										{timeLeft.seconds.toString().padStart(2, '0')}
									</Text>
									<Text size='sm' fw={600} c='dimmed' tt='uppercase'>
										Seconds
									</Text>
								</Stack>
							</Paper>
						</Grid.Col>
					</Grid>
				</Stack>
			</Paper>
		</Stack>
	);
}
