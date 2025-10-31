import { Card, Skeleton, Stack } from '@mantine/core';

export default function NewGraduationCardSkeleton() {
	return (
		<Card withBorder>
			<Stack align="center" gap="md">
				<Skeleton height={48} width={48} radius="sm" />
				<Stack align="center" gap="xs">
					<Skeleton height={24} width={200} />
					<Stack align="center" gap="xs">
						<Skeleton height={16} width={280} />
						<Skeleton height={16} width={240} />
					</Stack>
				</Stack>
				<Skeleton height={36} width={180} radius="sm" />
			</Stack>
		</Card>
	);
}
