'use client';

import { Center, Container, Divider, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const TARGET_DATE = '2026-03-02T08:30:30';

function useCountdown(targetDate: string) {
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		function calculateTimeLeft() {
			const difference = new Date(targetDate).getTime() - Date.now();

			if (difference > 0) {
				setTimeLeft({
					days: Math.floor(difference / (1000 * 60 * 60 * 24)),
					hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
					minutes: Math.floor((difference / 1000 / 60) % 60),
					seconds: Math.floor((difference / 1000) % 60),
				});
			} else {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
			}
		}

		calculateTimeLeft();
		const timer = setInterval(calculateTimeLeft, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	return timeLeft;
}

export default function Maintenance() {
	const timeLeft = useCountdown(TARGET_DATE);

	return (
		<Container
			size='sm'
			style={{
				minHeight: '100vh',
			}}
		>
			<Center style={{ minHeight: '100vh' }}>
				<Stack align='center' gap='lg'>
					<div style={{ height: 160, overflow: 'hidden' }}>
						<Image
							src='/images/logo-dark.png'
							alt='Limkokwing Logo'
							width={160}
							height={160}
							style={{
								height: '100%',
								width: '100%',
								objectFit: 'contain',
								padding: 'var(--mantine-spacing-md)',
							}}
							priority
						/>
					</div>

					<Stack align='center' gap='md'>
						<Title
							order={2}
							style={{
								fontWeight: 300,
								letterSpacing: '0.025em',
								color: 'var(--mantine-color-white)',
								opacity: 0.9,
							}}
						>
							Back in: {timeLeft.days > 1 && `${timeLeft.days} day `}
							{timeLeft.hours > 0 && `${timeLeft.hours}h `}
							{timeLeft.minutes}m {timeLeft.seconds}s
						</Title>

						<Divider
							size='xs'
							style={{
								width: 64,
								backgroundColor: 'var(--mantine-color-white)',
								opacity: 0.3,
							}}
						/>

						<Text
							size='sm'
							style={{
								color: 'var(--mantine-color-white)',
								opacity: 0.6,
								textAlign: 'center',
							}}
						>
							We are currently performing maintenance on the system.
						</Text>
					</Stack>
				</Stack>
			</Center>
		</Container>
	);
}
