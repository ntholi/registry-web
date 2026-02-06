'use client';

import { Badge, Box, Divider, Group, Paper, Stack, Text } from '@mantine/core';
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
				<Box>
					<Group justify='space-between'>
						<Text size='sm'>Academic Status</Text>
						<Badge
							variant='light'
							radius={'xs'}
							c={getStatusColor(remarks.status.toLowerCase() as AllStatusType)}
						>
							{remarks.status}
						</Badge>
					</Group>

					<Text size='sm' c='dimmed'>
						{remarks.details}
					</Text>
				</Box>

				{hasOutstanding && (
					<>
						<Divider />
						{remarks.failedModules.length > 0 && (
							<Stack gap='xs'>
								<Text size='xs' c='dimmed'>
									Modules to Repeat
								</Text>
								{remarks.failedModules.map((mod, idx) => (
									<Text key={`failed-${mod.code}-${idx}`} size='sm' c='red'>
										{mod.code} - {mod.name}
									</Text>
								))}
							</Stack>
						)}
						{remarks.supplementaryModules.length > 0 && (
							<Stack gap='xs'>
								<Text size='xs' c='dimmed'>
									Modules to Supplement
								</Text>
								{remarks.supplementaryModules.map((mod, idx) => (
									<Text key={`supp-${mod.code}-${idx}`} size='sm' c='orange'>
										{mod.code} - {mod.name}
									</Text>
								))}
							</Stack>
						)}
					</>
				)}
			</Stack>
		</Paper>
	);
}
