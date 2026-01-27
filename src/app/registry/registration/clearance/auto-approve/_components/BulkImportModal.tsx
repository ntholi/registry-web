'use client';

import {
	Alert,
	Button,
	FileButton,
	Group,
	Modal,
	Select,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconFileUpload,
	IconUpload,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { DashboardUser } from '@/core/database';
import { bulkCreateAutoApprovals } from '../_server/actions';

type ParsedRow = {
	stdNo: number;
	termCode: string;
	valid: boolean;
	error?: string;
};

export default function BulkImportModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const { data: session } = useSession();
	const userRole = session?.user?.role as DashboardUser | undefined;
	const isAdmin = userRole === 'admin';

	const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
	const [department, setDepartment] = useState<string | null>(
		isAdmin ? null : (userRole ?? null)
	);
	const [fileName, setFileName] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async () => {
			const validRows = parsedData.filter((row) => row.valid);
			return bulkCreateAutoApprovals(
				validRows.map((row) => ({ stdNo: row.stdNo, termCode: row.termCode })),
				department as DashboardUser
			);
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ['auto-approvals'] });
			notifications.show({
				title: 'Import Complete',
				message: `${result.inserted} rules created, ${result.skipped} duplicates skipped, ${result.invalidTermCodes} invalid term codes`,
				color: 'green',
			});
			handleClose();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Import Failed',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleClose() {
		setParsedData([]);
		setFileName(null);
		if (isAdmin) setDepartment(null);
		close();
	}

	function parseCSV(content: string): ParsedRow[] {
		const lines = content.trim().split('\n');
		const rows: ParsedRow[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			if (
				i === 0 &&
				(line.toLowerCase().includes('stdno') ||
					line.toLowerCase().includes('student'))
			) {
				continue;
			}

			const parts = line.split(',').map((p) => p.trim());
			const stdNoStr = parts[0];
			const termCode = parts[1];

			const stdNo = Number.parseInt(stdNoStr, 10);
			if (Number.isNaN(stdNo)) {
				rows.push({
					stdNo: 0,
					termCode: termCode || '',
					valid: false,
					error: 'Invalid student number',
				});
				continue;
			}

			if (!termCode || !/^\d{4}-\d{2}$/.test(termCode)) {
				rows.push({
					stdNo,
					termCode: termCode || '',
					valid: false,
					error: 'Invalid term code (expected YYYY-MM)',
				});
				continue;
			}

			rows.push({ stdNo, termCode, valid: true });
		}

		return rows;
	}

	function handleFileSelect(file: File | null) {
		if (!file) return;

		setFileName(file.name);
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			const parsed = parseCSV(content);
			setParsedData(parsed);
		};
		reader.readAsText(file);
	}

	const validCount = parsedData.filter((r) => r.valid).length;
	const invalidCount = parsedData.filter((r) => !r.valid).length;

	return (
		<>
			<Button
				leftSection={<IconFileUpload size={16} />}
				variant='light'
				onClick={open}
			>
				Bulk Import
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Bulk Import Auto-Approvals'
				size='lg'
			>
				<Stack>
					{isAdmin && (
						<Select
							label='Department'
							placeholder='Select department'
							data={[
								{ value: 'finance', label: 'Finance' },
								{ value: 'library', label: 'Library' },
							]}
							value={department}
							onChange={setDepartment}
							required
						/>
					)}

					<Stack gap='xs'>
						<Text size='sm' fw={500}>
							Upload CSV File
						</Text>
						<Text size='xs' c='dimmed'>
							CSV format: stdNo,termCode (e.g., 901234,2026-02)
						</Text>
						<FileButton onChange={handleFileSelect} accept='.csv,text/csv'>
							{(props) => (
								<Button
									{...props}
									leftSection={<IconUpload size={16} />}
									variant='default'
								>
									{fileName || 'Select CSV File'}
								</Button>
							)}
						</FileButton>
					</Stack>

					{parsedData.length > 0 && (
						<>
							<Group>
								<Text size='sm'>
									Valid: <strong>{validCount}</strong>
								</Text>
								<Text size='sm' c='red'>
									Invalid: <strong>{invalidCount}</strong>
								</Text>
							</Group>

							{invalidCount > 0 && (
								<Alert color='yellow' icon={<IconAlertCircle size={16} />}>
									{invalidCount} row(s) have errors and will be skipped
								</Alert>
							)}

							<Table.ScrollContainer minWidth={400} mah={300}>
								<Table striped highlightOnHover>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Student No</Table.Th>
											<Table.Th>Term Code</Table.Th>
											<Table.Th>Status</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{parsedData.slice(0, 50).map((row, idx) => (
											<Table.Tr key={idx} c={row.valid ? undefined : 'red'}>
												<Table.Td>{row.stdNo || '-'}</Table.Td>
												<Table.Td>{row.termCode || '-'}</Table.Td>
												<Table.Td>{row.valid ? '✓' : row.error}</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</Table.ScrollContainer>
							{parsedData.length > 50 && (
								<Text size='xs' c='dimmed'>
									Showing first 50 of {parsedData.length} rows
								</Text>
							)}
						</>
					)}

					<Group justify='flex-end'>
						<Button variant='default' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={validCount === 0 || (isAdmin && !department)}
						>
							Import {validCount} Rules
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
