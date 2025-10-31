import { Divider, Grid, Group, Paper, Skeleton, Stack, ThemeIcon } from '@mantine/core';
import { IconBook, IconTrophy } from '@tabler/icons-react';
import { studentColors } from '../utils/colors';

type Props = {
	isMobile: boolean;
};

export default function HeroSkeleton({ isMobile }: Props) {
	return (
		<Paper shadow="sm" p="xl" radius="md" withBorder>
			<Stack gap="lg">
				<Group gap="lg">
					<Skeleton height={70} width={70} radius="sm" />
					<Stack gap={4} flex={1}>
						<Skeleton height={24} width={200} />
						<Group gap="xl" mt="xs" align="center">
							<Skeleton height={16} width={80} />
							<Skeleton height={14} width={100} />
						</Group>
					</Stack>
				</Group>

				<Divider />

				<Stack gap="xl">
					<Group justify="space-between">
						<Stack gap={2}>
							<Skeleton height={20} width={250} />
							<Skeleton height={14} width={120} />
						</Stack>
					</Group>

					<Grid gutter="xl">
						<Grid.Col span={{ base: 6 }}>
							<Stack gap="xs" align="center">
								{!isMobile && (
									<ThemeIcon
										size="xl"
										variant="light"
										color={studentColors.theme.secondary}
										radius="md"
									>
										<IconTrophy size="1.2rem" />
									</ThemeIcon>
								)}

								<Skeleton height={12} width={40} />
								<Skeleton height={28} width={60} />
							</Stack>
						</Grid.Col>

						<Grid.Col span={{ base: 6 }}>
							<Stack gap="xs" align="center">
								{!isMobile && (
									<ThemeIcon
										size="xl"
										variant="light"
										color={studentColors.theme.accent}
										radius="md"
									>
										<IconBook size="1.2rem" />
									</ThemeIcon>
								)}

								<Skeleton height={12} width={50} />
								<Skeleton height={28} width={40} />
							</Stack>
						</Grid.Col>
					</Grid>
				</Stack>
			</Stack>
		</Paper>
	);
}
