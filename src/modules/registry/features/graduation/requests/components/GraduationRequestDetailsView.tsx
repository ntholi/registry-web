'use client';

import { ActionIcon, Flex, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import { FieldView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import type { getGraduationRequest } from '../../clearance/server/requests/actions';

interface Props {
	value: NonNullable<Awaited<ReturnType<typeof getGraduationRequest>>>;
}

export default function GraduationRequestDetailsView({ value }: Props) {
	return (
		<Stack gap='lg'>
			<StudentNameView
				stdNo={value.studentProgram.stdNo}
				name={value.studentProgram.student.name}
			/>
			<Flex justify='space-between' w='100%'>
				<FieldView label='Program' underline={false}>
					{value.studentProgram.structure.program.name}
				</FieldView>
			</Flex>
			<Flex justify='space-between' w='100%'>
				<FieldView label='Created At' underline={false}>
					{value.createdAt
						? new Date(value.createdAt).toLocaleDateString()
						: 'N/A'}
				</FieldView>
				{value.updatedAt && (
					<FieldView label='Updated At' underline={false}>
						{new Date(value.updatedAt).toLocaleDateString()}
					</FieldView>
				)}
			</Flex>
			{value.message && (
				<Paper withBorder p='md'>
					<FieldView label='Message' underline={false}>
						<Text size='sm'>{value.message}</Text>
					</FieldView>
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
