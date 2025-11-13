import {
	Box,
	Card,
	CardSection,
	Container,
	Flex,
	SimpleGrid,
	Skeleton,
	Stack,
} from '@mantine/core';

export default function CoursesLoading() {
	return (
		<Container mt='lg' size='xl'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Card
						key={i}
						shadow='lg'
						padding='lg'
						radius='sm'
						withBorder
						style={{ overflow: 'hidden' }}
					>
						<CardSection
							style={{
								height: '8.5rem',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							<Skeleton height='100%' radius={6} />

							<Box
								style={{
									position: 'absolute',
									zIndex: 2,
									inset: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0 2rem',
								}}
							>
								<Box
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Skeleton height={72} width={72} radius='xl' />
								</Box>
								<Box />
							</Box>
						</CardSection>

						<Stack gap='sm' mt='md'>
							<Flex justify={'space-between'} align={'baseline'}>
								<Skeleton height={22} width='65%' radius='sm' />
								<Skeleton height={20} width={80} radius='sm' />
							</Flex>
						</Stack>
					</Card>
				))}
			</SimpleGrid>
		</Container>
	);
}
