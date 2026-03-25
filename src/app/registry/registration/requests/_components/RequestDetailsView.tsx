'use client';

import { Badge, Flex, Paper, SimpleGrid, Stack } from '@mantine/core';
import StudentNameView from '@/app/registry/_components/StudentNameView';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { formatSemester } from '@/shared/lib/utils/utils';
import { FieldView } from '@/shared/ui/adease';
import type { getRegistrationRequest } from '../_server/requests/actions';

type Props = {
	value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
	sponsorship?: {
		sponsor?: {
			name?: string | null;
		} | null;
		borrowerNo?: string | null;
		bankName?: string | null;
		accountNumber?: string | null;
	} | null;
};

export default function RequestDetailsView({ value, sponsorship }: Props) {
	return (
		<Stack gap='md'>
			<StudentNameView stdNo={value.stdNo} name={value.student.name} />

			<FieldView label='Date' underline={false}>
				{formatDateTime(value.createdAt)}
			</FieldView>

			<Flex justify={'space-between'} w='100%'>
				<FieldView label='Semester' underline={false}>
					{formatSemester(value.semesterNumber)}
				</FieldView>
				<Badge
					radius={'sm'}
					variant='light'
					color={getStatusColor(value.semesterStatus)}
				>
					{value.semesterStatus}
				</Badge>
			</Flex>

			<Flex justify={'space-between'} w='100%'>
				<FieldView label='Term' underline={false}>
					{value.term.code}
				</FieldView>
				<Badge radius={'sm'} color={getStatusColor(value.status)}>
					{value.status}
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
