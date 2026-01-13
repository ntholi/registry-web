'use client';

import { Badge, Box, Flex, Group } from '@mantine/core';
import type useConfigDefaults from '@/shared/lib/hooks/use-config-defaults';
import { formatDuration } from '../../_lib/utils';
import AddSlotAllocationModal from '../../_shared/components/AddSlotAllocationModal';
import AddAllocationModal from './AddAllocationModal';
import AllocationTable, { type AllocationData } from './AllocationTable';

type Props = {
	filteredAllocations: AllocationData[];
	userId: string;
	selectedTermId: number | null;
	termCode: string | undefined;
	totalMinutes: number;
	totalStudents: number;
	defaults: ReturnType<typeof useConfigDefaults>['defaults'];
};

export default function AllocationTab({
	filteredAllocations,
	userId,
	selectedTermId,
	totalMinutes,
	totalStudents,
	defaults,
}: Props) {
	return (
		<Box>
			<Box mt='lg'>
				<Flex justify='space-between' align={'flex-end'} mb='xs'>
					<Group align='center' gap='xs'>
						<Badge variant='light' color='cyan' radius={'sm'}>
							{formatDuration(totalMinutes)}
						</Badge>
						<Badge variant='light' color='teal' radius={'sm'}>
							{`${totalStudents} Student${totalStudents !== 1 ? 's' : ''}`}
						</Badge>
					</Group>
					<Group gap='xs'>
						<AddSlotAllocationModal
							userId={userId}
							termId={selectedTermId!}
							defaultDuration={defaults?.duration}
						/>
						<AddAllocationModal
							userId={userId}
							termId={selectedTermId!}
							defaultDuration={defaults?.duration}
							defaultAllowedDays={defaults?.allowedDays}
							defaultStartTime={defaults?.startTime}
							defaultEndTime={defaults?.endTime}
						/>
					</Group>
				</Flex>

				<AllocationTable
					allocations={filteredAllocations}
					userId={userId}
					defaults={defaults}
					emptyMessage='No allocations found for this term. Click "Add" button to create one.'
				/>
			</Box>
		</Box>
	);
}
