import { Card, Group, Stack, Text } from '@mantine/core';
import {
	IconCertificate,
	IconClock,
	IconUsers,
	IconUserCheck,
} from '@tabler/icons-react';

interface Props {
	totalGraduates: number;
	byGender: Array<{ gender: string; count: number }>;
	byLevel: Array<{ level: string; count: number }>;
	averageAge: number | null;
	averageTimeToGraduate: number | null;
}

export default function GraduationStats({
	totalGraduates,
	byGender,
	byLevel,
	averageAge,
	averageTimeToGraduate,
}: Props) {
	const maleCount = byGender.find((g) => g.gender === 'Male')?.count || 0;
	const femaleCount = byGender.find((g) => g.gender === 'Female')?.count || 0;

	return (
		<Group grow>
			<Card withBorder p='md'>
				<Stack gap='xs' align='center'>
					<IconUsers
						size={32}
						style={{ color: 'var(--mantine-color-blue-6)' }}
					/>
					<Text size='xl' fw={700} c='blue'>
						{totalGraduates}
					</Text>
					<Text size='xs' c='dimmed' ta='center'>
						Total Graduates
					</Text>
				</Stack>
			</Card>

			<Card withBorder p='md'>
				<Stack gap='xs' align='center'>
					<IconUserCheck
						size={32}
						style={{ color: 'var(--mantine-color-green-6)' }}
					/>
					<Group gap='xs'>
						<Text size='sm' fw={600} c='green'>
							M: {maleCount}
						</Text>
						<Text size='sm' c='dimmed'>
							/
						</Text>
						<Text size='sm' fw={600} c='pink'>
							F: {femaleCount}
						</Text>
					</Group>
					<Text size='xs' c='dimmed' ta='center'>
						By Gender
					</Text>
				</Stack>
			</Card>

			<Card withBorder p='md'>
				<Stack gap='xs' align='center'>
					<IconCertificate
						size={32}
						style={{ color: 'var(--mantine-color-orange-6)' }}
					/>
					<Text size='xl' fw={700} c='orange'>
						{byLevel.length}
					</Text>
					<Text size='xs' c='dimmed' ta='center'>
						Program Levels
					</Text>
				</Stack>
			</Card>

			{averageAge !== null && (
				<Card withBorder p='md'>
					<Stack gap='xs' align='center'>
						<IconUsers
							size={32}
							style={{ color: 'var(--mantine-color-violet-6)' }}
						/>
						<Text size='xl' fw={700} c='violet'>
							{averageAge}
						</Text>
						<Text size='xs' c='dimmed' ta='center'>
							Average Age (years)
						</Text>
					</Stack>
				</Card>
			)}

			{averageTimeToGraduate !== null && (
				<Card withBorder p='md'>
					<Stack gap='xs' align='center'>
						<IconClock
							size={32}
							style={{ color: 'var(--mantine-color-teal-6)' }}
						/>
						<Text size='xl' fw={700} c='teal'>
							{averageTimeToGraduate}
						</Text>
						<Text size='xs' c='dimmed' ta='center'>
							Avg. Time to Graduate (months)
						</Text>
					</Stack>
				</Card>
			)}
		</Group>
	);
}
