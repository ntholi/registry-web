'use client';

import { Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import type { getAcademicRemarks } from '@/shared/lib/utils/grades';

type Props = {
	remarks: ReturnType<typeof getAcademicRemarks>;
};

export default function AcademicRemarksSummary({ remarks }: Props) {
	const hasOutstanding =
		remarks.failedModules.length > 0 || remarks.supplementaryModules.length > 0;

	return (
		<Paper p='md' radius='md' withBorder>
			<Stack gap='sm'>
				<Group justify='space-between'>
					<Text size='sm'>Academic Status</Text>
					<Text
						size='sm'
						fw={600}
						c={getStatusColor(remarks.status.toLowerCase() as AllStatusType)}
					>
						{remarks.status}
					</Text>
				</Group>

				{hasOutstanding && (
					<>
						<Divider />
						{remarks.failedModules.length > 0 && (
							<Stack gap='xs'>
								<Text size='xs' c='dimmed'>
									Modules to Repeat
								</Text>
								{remarks.failedModules.map((mod, idx) => (
									<Group key={`failed-${mod.code}-${idx}`} gap='xs'>
										<Text size='sm'>
											{mod.code} - {mod.name}
										</Text>
									</Group>
								))}
							</Stack>
						)}
						{remarks.supplementaryModules.length > 0 && (
							<Stack gap='xs'>
								<Text size='xs' c='dimmed'>
									Modules to Supplement
								</Text>
								{remarks.supplementaryModules.map((mod, idx) => (
									<Group key={`supp-${mod.code}-${idx}`} gap='xs'>
										<Text size='sm'>
											{mod.code} - {mod.name}
										</Text>
									</Group>
								))}
							</Stack>
						)}
					</>
				)}
			</Stack>
		</Paper>
	);
}
