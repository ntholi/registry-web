'use client';

import type { getSponsoredStudent } from '@finance/sponsors';
import {
	ActionIcon,
	Badge,
	Flex,
	Paper,
	SimpleGrid,
	Stack,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatSemester } from '@/shared/lib/utils/utils';
import { FieldView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import type { getRegistrationRequest } from '../_server/requests/actions';

type Props = {
	value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
	sponsorship?: Awaited<ReturnType<typeof getSponsoredStudent>> | null;
};

export default function RequestDetailsView({ value, sponsorship }: Props) {
	return (
		<Stack gap='md'>
			<StudentNameView stdNo={value.stdNo} name={value.student.name} />

			<FieldView label='Term' underline={false}>
				{value.term.code}
			</FieldView>

			<Flex justify={'space-between'} w='100%'>
				<FieldView label='Semester' underline={false}>
					{formatSemester(value.semesterNumber)}
				</FieldView>
				<Badge radius={'sm'} color={getStatusColor(value.semesterStatus)}>
					{value.semesterStatus}
				</Badge>
			</Flex>

			{sponsorship && (
				<Paper withBorder p={'md'}>
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<FieldView label='Sponsor' underline={false}>
							{sponsorship.sponsor?.name || '—'}
						</FieldView>
						<FieldView label='Borrower No.' underline={false}>
							{sponsorship.borrowerNo || '—'}
						</FieldView>
						<FieldView label='Bank Name' underline={false}>
							{sponsorship.bankName || '—'}
						</FieldView>
						<FieldView label='Account Number' underline={false}>
							{sponsorship.accountNumber || '—'}
						</FieldView>
					</SimpleGrid>
				</Paper>
			)}
		</Stack>
	);
}

function StudentNameView({ stdNo, name }: { stdNo: number; name: string }) {
	return (
		<FieldView label='Student' underline={false}>
			<Flex align='center' gap='xs'>
				<Link href={`/registry/students/${stdNo}`} size='sm' fw={500}>
					{name} ({stdNo})
				</Link>
				<Tooltip label='Copy student number'>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='sm'
						onClick={() => {
							navigator.clipboard.writeText(String(stdNo));
							notifications.show({
								message: 'Student number copied to clipboard',
								color: 'green',
							});
						}}
					>
						<IconCopy size={16} />
					</ActionIcon>
				</Tooltip>
			</Flex>
		</FieldView>
	);
}
