import {
	Card,
	Container,
	Divider,
	Flex,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
} from '@mantine/core';

export default function ProfileSkeleton() {
	return (
		<Container size="md">
			<Stack gap="xl">
				<Card withBorder shadow="sm" p="xl" radius="md">
					<Flex
						direction={{ base: 'column', sm: 'row' }}
						gap="xl"
						align={{ base: 'center', sm: 'flex-start' }}
					>
						<Skeleton height={180} width={180} radius="md" style={{ minWidth: 120 }} />

						<Stack gap="md" style={{ flex: 1 }}>
							<Stack gap="xs">
								<Skeleton height={32} width={250} mb="xs" />
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
									<Skeleton height={32} width={120} radius="xl" />
									<Skeleton height={20} width={180} />
								</SimpleGrid>
							</Stack>

							<Divider />

							<SimpleGrid cols={{ base: 2, sm: 3 }}>
								<Group gap="xs">
									<Skeleton height={24} width={24} radius="sm" />
									<Skeleton height={16} width={60} />
								</Group>
								<Group gap="xs">
									<Skeleton height={24} width={24} radius="sm" />
									<Skeleton height={16} width={80} />
								</Group>
								<Group gap="xs">
									<Skeleton height={24} width={24} radius="sm" />
									<Skeleton height={16} width={70} />
								</Group>
								<Group gap="xs">
									<Skeleton height={24} width={24} radius="sm" />
									<Skeleton height={16} width={100} />
								</Group>
							</SimpleGrid>
						</Stack>
					</Flex>
				</Card>

				<Paper shadow="sm" p="xl" radius="md" withBorder>
					<Stack gap="lg">
						<Skeleton height={24} width={180} />
						<Divider />
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
							<Stack gap="xs">
								<Skeleton height={14} width={100} />
								<Skeleton height={18} width={150} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={120} />
								<Skeleton height={18} width={180} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={80} />
								<Skeleton height={18} width={130} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={90} />
								<Skeleton height={18} width={140} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={110} />
								<Skeleton height={18} width={160} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={70} />
								<Skeleton height={18} width={120} />
							</Stack>
						</SimpleGrid>
					</Stack>
				</Paper>

				<Paper shadow="sm" p="xl" radius="md" withBorder>
					<Stack gap="lg">
						<Skeleton height={24} width={200} />
						<Divider />
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
							<Stack gap="xs">
								<Skeleton height={14} width={80} />
								<Skeleton height={18} width={200} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={90} />
								<Skeleton height={18} width={120} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={60} />
								<Skeleton height={18} width={80} />
							</Stack>
							<Stack gap="xs">
								<Skeleton height={14} width={70} />
								<Skeleton height={18} width={60} />
							</Stack>
						</SimpleGrid>
					</Stack>
				</Paper>
			</Stack>
		</Container>
	);
}
