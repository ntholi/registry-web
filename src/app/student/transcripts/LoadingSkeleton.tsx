'use client';

import { Box, Container, Group, Paper, Skeleton, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

function DesktopTableSkeleton() {
	return (
		<Stack gap='xs'>
			<Group justify='space-between'>
				<Skeleton height={16} width='15%' />
				<Skeleton height={16} width='35%' />
				<Skeleton height={16} width='10%' />
				<Skeleton height={16} width='15%' />
			</Group>
			{Array.from({ length: 4 }).map((_, index) => (
				<Group key={index} justify='space-between'>
					<Skeleton height={14} width='12%' />
					<Skeleton height={14} width='40%' />
					<Skeleton height={14} width='8%' />
					<Skeleton height={20} width='10%' radius='md' />
				</Group>
			))}
		</Stack>
	);
}

function MobileTableSkeleton() {
	return (
		<Stack gap='md'>
			{Array.from({ length: 3 }).map((_, index) => (
				<Paper key={index} shadow='sm' p='lg' radius='md' withBorder>
					<Stack gap='sm'>
						<Group justify='space-between' align='flex-start'>
							<Box flex={1}>
								<Skeleton height={16} width='60%' mb='xs' />
								<Skeleton height={12} width='90%' />
							</Box>
							<Skeleton height={24} width={40} radius='md' />
						</Group>
						<Skeleton height={1} />
						<Group justify='space-between'>
							<Skeleton height={14} width='30%' />
							<Skeleton height={20} width={50} radius='md' />
						</Group>
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}

export default function LoadingSkeleton() {
	const isMobile = useMediaQuery('(max-width: 768px)');

	return (
		<Container size='md'>
			<Stack gap='lg' py='md'>
				<Box ta='center'>
					<Skeleton height={32} width='40%' mx='auto' mb='xs' />
					<Skeleton height={16} width='30%' mx='auto' />
				</Box>

				<Paper p='xl' withBorder shadow='sm' mt='lg'>
					<Group justify='space-between' align='flex-start' wrap='wrap'>
						<Box>
							<Skeleton height={20} width={200} mb='xs' />
							<Skeleton height={14} width={120} />
						</Box>
						<Box ta={{ base: 'left', sm: 'right' }}>
							<Skeleton height={20} width={250} mb='xs' />
							<Skeleton height={14} width={150} />
						</Box>
					</Group>
				</Paper>

				<Stack gap='md'>
					{Array.from({ length: 3 }).map((_, index) => (
						<Paper key={index} withBorder radius='md'>
							<Box
								p='md'
								style={{
									borderBottom: '1px solid var(--mantine-color-gray-3)',
								}}
							>
								<Group justify='space-between' align='center'>
									<Box>
										<Skeleton height={16} width={120} mb='xs' />
										<Skeleton height={14} width={100} />
									</Box>
									<Skeleton height={16} width={20} />
								</Group>
							</Box>
							<Box p='md'>{isMobile ? <MobileTableSkeleton /> : <DesktopTableSkeleton />}</Box>
						</Paper>
					))}
				</Stack>
			</Stack>
		</Container>
	);
}
