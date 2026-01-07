import { Card, Group, Stack, Text } from '@mantine/core';
import {
	IconCalendar,
	IconClock,
	IconGenderFemale,
	IconGenderMale,
	IconSchool,
} from '@tabler/icons-react';
import type { GraduationSummaryReport } from '../_lib/types';

interface Props {
	summary: GraduationSummaryReport;
}

export default function GraduationStats({ summary }: Props) {
	const {
		totalGraduates,
		maleCount,
		femaleCount,
		averageAge,
		averageTimeToGraduate,
		graduationDate,
	} = summary;

	return (
		<Group grow>
			<Card withBorder p='md'>
				<Stack gap='xs' align='center'>
					<IconSchool
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
					<IconGenderMale
						size={32}
						style={{ color: 'var(--mantine-color-cyan-6)' }}
					/>
					<Text size='xl' fw={700} c='cyan'>
						{maleCount}
					</Text>
					<Text size='xs' c='dimmed' ta='center'>
						Male
					</Text>
				</Stack>
			</Card>

			<Card withBorder p='md'>
				<Stack gap='xs' align='center'>
					<IconGenderFemale
						size={32}
						style={{ color: 'var(--mantine-color-pink-6)' }}
					/>
					<Text size='xl' fw={700} c='pink'>
						{femaleCount}
					</Text>
					<Text size='xs' c='dimmed' ta='center'>
						Female
					</Text>
				</Stack>
			</Card>

			{averageAge !== null && (
				<Card withBorder p='md'>
					<Stack gap='xs' align='center'>
						<IconCalendar
							size={32}
							style={{ color: 'var(--mantine-color-orange-6)' }}
						/>
						<Text size='xl' fw={700} c='orange'>
							{averageAge}
						</Text>
						<Text size='xs' c='dimmed' ta='center'>
							Avg. Age
						</Text>
					</Stack>
				</Card>
			)}

			{averageTimeToGraduate !== null && (
				<Card withBorder p='md'>
					<Stack gap='xs' align='center'>
						<IconClock
							size={32}
							style={{ color: 'var(--mantine-color-green-6)' }}
						/>
						<Text size='xl' fw={700} c='green'>
							{averageTimeToGraduate}
						</Text>
						<Text size='xs' c='dimmed' ta='center'>
							Avg. Years to Graduate
						</Text>
					</Stack>
				</Card>
			)}

			<Card withBorder p='md' bg='gray.0'>
				<Stack gap='xs' align='center'>
					<Text size='xs' c='dimmed' fw={600}>
						GRADUATION
					</Text>
					<Text size='sm' fw={600} ta='center'>
						{graduationDate}
					</Text>
					<Text size='xs' c='dimmed' ta='center'>
						Current Selection
					</Text>
				</Stack>
			</Card>
		</Group>
	);
}
