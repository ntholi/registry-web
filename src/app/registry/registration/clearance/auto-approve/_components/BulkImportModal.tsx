'use client';

import {
	ActionIcon,
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
import { IconFileUpload, IconUpload } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { getAllTerms } from '@/app/registry/terms';
import type { DashboardUser } from '@/core/database';
import { bulkCreateAutoApprovals } from '../_server/actions';

type ParsedRow = {
	stdNo: number;
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
	const [selectedTermCode, setSelectedTermCode] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const { data: terms } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	const termOptions =
		terms?.map((t) => ({ value: t.code, label: t.code })) ?? [];

	const mutation = useMutation({
		mutationFn: async () => {
			const validRows = parsedData.filter((row) => row.valid);
			if (!selectedTermCode) throw new Error('Please select a term');
			return bulkCreateAutoApprovals(
				validRows.map((row) => ({
					stdNo: row.stdNo,
					termCode: selectedTermCode,
				})),
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
		setSelectedTermCode(null);
		if (isAdmin) setDepartment(null);
		close();
	}

	function detectStudentNumberColumn(
		data: (string | number | null | undefined)[][]
	): number {
		if (data.length === 0) return -1;

		const colCounts = new Array(data[0].length).fill(0);
		const stdNoRegex = /^90\d{7}$/;

		// Sample first 100 rows
		const sampleSize = Math.min(data.length, 100);
		for (let r = 0; r < sampleSize; r++) {
			const row = data[r];
			for (let c = 0; c < row.length; c++) {
				const val = String(row[c] || '').trim();
				if (stdNoRegex.test(val)) {
					colCounts[c]++;
				}
			}
		}

		let maxCount = 0;
		let bestCol = -1;
		for (let c = 0; c < colCounts.length; c++) {
			if (colCounts[c] > maxCount) {
				maxCount = colCounts[c];
				bestCol = c;
			}
		}

		return bestCol;
	}

	function handleFileSelect(file: File | null) {
		if (!file) return;

		setFileName(file.name);
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];
				const jsonData = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
				}) as (string | number | null | undefined)[][];

				const stdNoColIndex = detectStudentNumberColumn(jsonData);

				if (stdNoColIndex === -1) {
					notifications.show({
						title: 'Detection Error',
						message:
							'Could not find a student number column (9 digits starting with 90)',
						color: 'red',
					});
					return;
				}

				const rows: ParsedRow[] = [];
				const stdNoRegex = /^90\d{7}$/;

				for (let i = 0; i < jsonData.length; i++) {
					const val = String(jsonData[i][stdNoColIndex] || '').trim();
					if (!val) continue;

					const stdNo = Number.parseInt(val, 10);
					if (stdNoRegex.test(val)) {
						rows.push({ stdNo, valid: true });
					}
				}

				setParsedData(rows);
			} catch (_err) {
				notifications.show({
					title: 'Error',
					message:
						'Failed to parse file. Ensure it is a valid CSV or Excel file.',
					color: 'red',
				});
			}
		};
		reader.readAsArrayBuffer(file);
	}

	const validCount = parsedData.filter((r) => r.valid).length;

	return (
		<>
			<ActionIcon variant='light' size='lg' onClick={open}>
				<IconFileUpload size={16} />
			</ActionIcon>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Bulk Import Auto-Approvals'
				size='lg'
			>
				<Stack>
					<Group grow>
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
						<Select
							label='Import Term'
							placeholder='Select term for all students'
							data={termOptions}
							value={selectedTermCode}
							onChange={setSelectedTermCode}
							required
							searchable
						/>
					</Group>

					<Stack gap='xs'>
						<Text size='sm' fw={500}>
							Upload File
						</Text>
						<Text size='xs' c='dimmed'>
							Supports CSV and Excel (.xlsx, .xls). System will automatically
							find the student number column.
						</Text>
						<FileButton
							onChange={handleFileSelect}
							accept='.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
						>
							{(props) => (
								<Button
									{...props}
									leftSection={<IconUpload size={16} />}
									variant='default'
								>
									{fileName || 'Select File'}
								</Button>
							)}
						</FileButton>
					</Stack>

					{parsedData.length > 0 && (
						<>
							<Group>
								<Text size='sm'>
									Students found: <strong>{validCount}</strong>
								</Text>
							</Group>

							<Table.ScrollContainer minWidth={300} mah={300}>
								<Table striped highlightOnHover>
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Student No</Table.Th>
											<Table.Th>Status</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{parsedData.slice(0, 50).map((row, idx) => (
											<Table.Tr key={idx}>
												<Table.Td>{row.stdNo}</Table.Td>
												<Table.Td>{row.valid ? '✓' : row.error}</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</Table.ScrollContainer>
							{parsedData.length > 50 && (
								<Text size='xs' c='dimmed'>
									Showing first 50 of {parsedData.length} records
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
							disabled={
								validCount === 0 ||
								!selectedTermCode ||
								(isAdmin && !department)
							}
						>
							Import {validCount} Records
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
