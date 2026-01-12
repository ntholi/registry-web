'use client';

import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	FileInput,
	Group,
	Modal,
	Stack,
	Table,
	Text,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconCheck,
	IconFileUpload,
	IconUpload,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkCreateBlockedStudents } from '../_server/actions';

interface ParsedStudent {
	stdNo: number;
	reason: string;
}

interface ImportResult {
	imported: number;
	skipped: number;
}

export default function ImportBlockedStudentsDialog() {
	const [opened, { open, close }] = useDisclosure(false);
	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
	const [importing, setImporting] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const queryClient = useQueryClient();

	function reset() {
		setFile(null);
		setParsedData([]);
		setResult(null);
	}

	function handleClose() {
		reset();
		close();
	}

	async function handleFileSelect(selectedFile: File | null) {
		if (!selectedFile) {
			setFile(null);
			setParsedData([]);
			return;
		}

		setFile(selectedFile);
		setResult(null);

		try {
			const data = await readExcelFile(selectedFile);
			setParsedData(data);
		} catch (error) {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to parse file',
				color: 'red',
			});
			setParsedData([]);
		}
	}

	async function handleImport() {
		if (parsedData.length === 0) return;

		setImporting(true);
		try {
			const res = await bulkCreateBlockedStudents(parsedData);
			setResult(res);
			queryClient.invalidateQueries({ queryKey: ['blocked-students'] });
			notifications.show({
				title: 'Import Complete',
				message: `Imported ${res.imported} students, skipped ${res.skipped} already blocked`,
				color: 'green',
				icon: <IconCheck size={18} />,
			});
		} catch (error) {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to import students',
				color: 'red',
			});
		} finally {
			setImporting(false);
		}
	}

	return (
		<>
			<Tooltip label='Import from Excel'>
				<ActionIcon variant='default' size='lg' onClick={open}>
					<IconFileUpload size={18} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Import Blocked Students'
				size='lg'
				centered
			>
				<Stack gap='md'>
					{result ? (
						<Alert
							icon={<IconCheck size={18} />}
							color='green'
							title='Import Complete'
						>
							Successfully imported {result.imported} students.
							{result.skipped > 0 &&
								` Skipped ${result.skipped} already blocked.`}
						</Alert>
					) : (
						<>
							<FileInput
								label='Select Excel File'
								placeholder='Choose .xlsx or .xls file'
								accept='.xlsx,.xls'
								leftSection={<IconUpload size={16} />}
								value={file}
								onChange={handleFileSelect}
							/>

							<Text size='xs' c='dimmed'>
								The system will auto-detect the student number column (9-digit
								numbers) and look for a "reason" column for blocking reasons.
							</Text>

							{parsedData.length > 0 && (
								<>
									<Group gap='xs'>
										<Badge color='blue'>
											{parsedData.length} students found
										</Badge>
									</Group>

									<Table.ScrollContainer minWidth={400}>
										<Table striped highlightOnHover withTableBorder>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Student No</Table.Th>
													<Table.Th>Reason</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{parsedData.slice(0, 10).map((row, idx) => (
													<Table.Tr key={idx}>
														<Table.Td>{row.stdNo}</Table.Td>
														<Table.Td>{row.reason}</Table.Td>
													</Table.Tr>
												))}
												{parsedData.length > 10 && (
													<Table.Tr>
														<Table.Td colSpan={2}>
															<Text size='sm' c='dimmed' ta='center'>
																... and {parsedData.length - 10} more
															</Text>
														</Table.Td>
													</Table.Tr>
												)}
											</Table.Tbody>
										</Table>
									</Table.ScrollContainer>
								</>
							)}

							{file && parsedData.length === 0 && (
								<Alert
									icon={<IconAlertCircle size={18} />}
									color='yellow'
									title='No Students Found'
								>
									Could not find a column with 9-digit student numbers in the
									file.
								</Alert>
							)}
						</>
					)}

					<Group justify='flex-end'>
						<Button variant='light' color='gray' onClick={handleClose}>
							{result ? 'Close' : 'Cancel'}
						</Button>
						{!result && (
							<Button
								onClick={handleImport}
								loading={importing}
								disabled={parsedData.length === 0}
							>
								Import {parsedData.length > 0 && `(${parsedData.length})`}
							</Button>
						)}
					</Group>
				</Stack>
			</Modal>
		</>
	);
}

async function readExcelFile(file: File): Promise<ParsedStudent[]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
				const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');

				const allRows: (string | number)[][] = [];
				for (let row = range.s.r; row <= range.e.r; row++) {
					const rowData: (string | number)[] = [];
					for (let col = range.s.c; col <= range.e.c; col++) {
						const cell = firstSheet[XLSX.utils.encode_cell({ r: row, c: col })];
						rowData.push(cell ? cell.v : '');
					}
					if (rowData.some((cell) => cell !== '')) {
						allRows.push(rowData);
					}
				}

				if (allRows.length === 0) {
					resolve([]);
					return;
				}

				let stdNoColIdx = -1;
				let bestMatchCount = 0;

				for (let col = 0; col <= range.e.c - range.s.c; col++) {
					let nineDigitCount = 0;
					for (const row of allRows) {
						const val = String(row[col] ?? '').trim();
						if (/^\d{9}$/.test(val)) {
							nineDigitCount++;
						}
					}
					if (nineDigitCount > bestMatchCount && nineDigitCount >= 1) {
						bestMatchCount = nineDigitCount;
						stdNoColIdx = col;
					}
				}

				if (stdNoColIdx === -1) {
					resolve([]);
					return;
				}

				let reasonColIdx = -1;
				for (let col = 0; col <= range.e.c - range.s.c; col++) {
					for (const row of allRows) {
						const val = String(row[col] ?? '')
							.toLowerCase()
							.trim();
						if (val === 'reason') {
							reasonColIdx = col;
							break;
						}
					}
					if (reasonColIdx !== -1) break;
				}

				const students: ParsedStudent[] = [];
				const seenStdNos = new Set<number>();

				for (const row of allRows) {
					const stdNoVal = String(row[stdNoColIdx] ?? '').trim();
					if (!/^\d{9}$/.test(stdNoVal)) continue;

					const stdNo = Number.parseInt(stdNoVal, 10);
					if (seenStdNos.has(stdNo)) continue;
					seenStdNos.add(stdNo);

					const reason =
						reasonColIdx !== -1 && row[reasonColIdx]
							? String(row[reasonColIdx]).trim()
							: 'No reason provided';

					if (reason.toLowerCase() === 'reason') continue;

					students.push({ stdNo, reason });
				}

				resolve(students);
			} catch (error) {
				reject(new Error(`Failed to parse Excel file: ${error}`));
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsArrayBuffer(file);
	});
}
