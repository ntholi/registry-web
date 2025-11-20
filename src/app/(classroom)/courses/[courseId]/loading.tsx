import { Container, Group, Paper, Skeleton, Stack } from '@mantine/core';

export default function CourseLoading() {
	return (
		<Container size='xl' py='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='xl' shadow='xs'>
					<Stack gap='lg'>
						<Group justify='space-between' align='flex-start'>
							<Stack gap='xs' style={{ flex: 1 }}>
								<Skeleton height={36} width='60%' radius='md' />
								<Skeleton height={24} width='80%' radius='md' />
							</Stack>
							<Skeleton height={32} width={160} radius='md' />
						</Group>

						<Group gap='md'>
							<Skeleton height={28} width={120} radius='sm' />
							<Skeleton height={28} width={100} radius='sm' />
							<Skeleton height={28} width={140} radius='sm' />
							<Skeleton height={20} width={150} radius='sm' />
						</Group>
					</Stack>
				</Paper>

				<Stack gap='lg'>
					<Group gap='sm'>
						<Skeleton height={36} width={120} radius='xl' />
						<Skeleton height={36} width={140} radius='xl' />
						<Skeleton height={36} width={100} radius='xl' />
					</Group>

					<Stack gap='lg'>
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} height={150} radius='lg' />
						))}
					</Stack>
				</Stack>
			</Stack>
		</Container>
	);
}
