'use client';

import {
	Badge,
	Group,
	Paper,
	Progress,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import type { OriginSchoolRow } from '../_server/repository';

type Props = {
	data: OriginSchoolRow[];
};

export default function OriginSchools({ data }: Props) {
	const total = data.reduce((sum, row) => sum + row.count, 0);

	return (
		<Paper withBorder p='md'>
			<Stack>
				<Group justify='space-between'>
					<Title order={4}>Origin Schools</Title>
					<Badge variant='light' size='lg'>
						{total} applicants
					</Badge>
				</Group>
				<Table.ScrollContainer minWidth={300} mah={500}>
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th w={40}>#</Table.Th>
								<Table.Th>School</Table.Th>
								<Table.Th ta='right' w={90}>
									Applicants
								</Table.Th>
								<Table.Th w={180}>Share</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{data.map((row, i) => {
								const pct = (row.count / total) * 100;
								return (
									<Table.Tr key={row.name}>
										<Table.Td>
											<Text size='sm' c='dimmed'>
												{i + 1}
											</Text>
										</Table.Td>
										<Table.Td>
											<Text size='sm'>{row.name}</Text>
										</Table.Td>
										<Table.Td ta='right'>
											<Text size='sm' fw={500}>
												{row.count}
											</Text>
										</Table.Td>
										<Table.Td>
											<Group gap='xs' wrap='nowrap'>
												<Progress value={pct} color='teal' size='sm' flex={1} />
												<Text size='xs' c='dimmed' w={40} ta='right'>
													{pct.toFixed(1)}%
												</Text>
											</Group>
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Stack>
		</Paper>
	);
}
