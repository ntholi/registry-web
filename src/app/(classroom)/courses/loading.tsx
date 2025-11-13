import { Container, SimpleGrid, Skeleton, Stack } from '@mantine/core';

export default function CoursesLoading() {
	return (
		<Container mt='lg' size='xl'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }}>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Stack key={i} gap='sm'>
						<Skeleton height={120} radius='md' />
						<Skeleton height={24} width='80%' radius='sm' />
						<Skeleton height={16} width='60%' radius='sm' />
					</Stack>
				))}
			</SimpleGrid>
		</Container>
	);
}
