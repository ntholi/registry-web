'use client';

import {
	Alert,
	Checkbox,
	Paper,
	Select,
	Table,
	Text,
	Title,
} from '@mantine/core';
import type { StudentModuleStatus } from '@registry/_database';
import { studentModuleStatus } from '@registry/_database';
import { IconInfoCircle } from '@tabler/icons-react';
import { getModuleTypeColor } from '@/shared/lib/utils/colors';
import { formatSemester } from '@/shared/lib/utils/utils';

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: string;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type Props = {
	modules: ModuleWithStatus[];
	selectedModules: Set<number>;
	onModuleToggle: (semesterModuleId: number) => void;
	onStatusChange?: (
		semesterModuleId: number,
		status: StudentModuleStatus
	) => void;
	error?: string;
};

export default function ModulesTable({
	modules,
	selectedModules,
	onModuleToggle,
	onStatusChange,
	error,
}: Props) {
	return (
		<>
			<Title order={4} mb='md'>
				Available Modules
			</Title>
			{modules.length === 0 ? (
				<Alert color='blue' icon={<IconInfoCircle size={16} />}>
					No modules available for automatic registration. Use the search above
					to manually add modules.
				</Alert>
			) : (
				<Paper withBorder>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Select</Table.Th>
								<Table.Th>Code</Table.Th>
								<Table.Th>Module Name</Table.Th>
								<Table.Th>Credits</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Semester</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{modules.map((module) => (
								<Table.Tr key={module.semesterModuleId}>
									<Table.Td>
										<Checkbox
											checked={selectedModules.has(module.semesterModuleId)}
											onChange={() => onModuleToggle(module.semesterModuleId)}
										/>
									</Table.Td>
									<Table.Td>
										<Text fw={500} size='sm'>
											{module.code}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>{module.name}</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>{module.credits}</Text>
									</Table.Td>
									<Table.Td>
										<Select
											size='xs'
											variant='filled'
											data={studentModuleStatus.enumValues}
											value={module.status}
											onChange={(value) => {
												if (value && onStatusChange) {
													onStatusChange(
														module.semesterModuleId,
														value as StudentModuleStatus
													);
												}
											}}
											styles={{
												input: {
													color: `var(--mantine-color-${getModuleTypeColor(module.status)}-5)`,
												},
											}}
										/>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>
											{formatSemester(module.semesterNo, 'mini')}
										</Text>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Paper>
			)}
			{error && (
				<Text size='sm' c='red' mt='xs'>
					{error}
				</Text>
			)}
		</>
	);
}
