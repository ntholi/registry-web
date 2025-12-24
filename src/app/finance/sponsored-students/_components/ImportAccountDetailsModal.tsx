'use client';

import { bulkUpdateAccountDetails } from '@finance/sponsors';
import {
	Alert,
	Badge,
	Button,
	FileInput,
	Group,
	Modal,
	Progress,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconCheck,
	IconExclamationCircle,
	IconUpload,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { getBooleanColor, statusColors } from '@/shared/lib/utils/colors';

interface ImportRow {
	stdNo: string;
	name: string;
	accountNumber: string;
	bankName: string;
}

interface ProcessedRow extends ImportRow {
	status: 'pending' | 'success' | 'error';
	error?: string;
}

interface UpdateResult {
	success: boolean;
	error?: string;
}

export default function ImportAccountDetailsModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const [file, setFile] = useState<File | null>(null);
	const [importData, setImportData] = useState<ProcessedRow[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const queryClient = useQueryClient();

	const BATCH_SIZE = 50;

	const updateMutation = useMutation({
		mutationFn: ({
			items,
			batchSize,
		}: {
			items: Array<{
				stdNoOrName: string;
				bankName: string;
				accountNumber: string;
			}>;
			batchSize: number;
		}) => bulkUpdateAccountDetails(items, batchSize),
	});

	const parseExcelFile = async (file: File): Promise<ImportRow[]> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const data = e.target?.result;
					const workbook = XLSX.read(data, { type: 'binary' });
					const sheetName = workbook.SheetNames[0];
					const worksheet = workbook.Sheets[sheetName];
					const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

					const rows: ImportRow[] = [];
					let foundDataStart = false;
					let stdNoIndex = -1;
					let nameIndex = -1;
					let accountNumberIndex = -1;
					let bankNameIndex = -1;

					for (let i = 0; i < json.length; i++) {
						const row = json[i] as string[];

						if (!foundDataStart) {
							const stdNoCol = row.findIndex((cell) => {
								if (typeof cell !== 'string') return false;
								const cellLower = cell.toLowerCase().trim();
								return (
									(cellLower.includes('student') && cellLower.includes('no')) ||
									cellLower === 'std no' ||
									cellLower === 'student no' ||
									cellLower === 'student no.'
								);
							});
							const nameCol = row.findIndex((cell) => {
								if (typeof cell !== 'string') return false;
								const cellLower = cell.toLowerCase().trim();
								return (
									(cellLower.includes('name') && !cellLower.includes('bank')) ||
									cellLower === 'names' ||
									cellLower.includes('names in full')
								);
							});
							const accountCol = row.findIndex((cell) => {
								if (typeof cell !== 'string') return false;
								const cellLower = cell.toLowerCase().trim();
								return (
									cellLower.includes('account') ||
									cellLower === 'account no' ||
									cellLower === 'account no.'
								);
							});
							const bankCol = row.findIndex((cell) => {
								if (typeof cell !== 'string') return false;
								const cellLower = cell.toLowerCase().trim();
								return (
									cellLower.includes('bank') ||
									cellLower === 'bank' ||
									cellLower === 'bank name'
								);
							});

							if (
								stdNoCol >= 0 &&
								nameCol >= 0 &&
								accountCol >= 0 &&
								bankCol >= 0
							) {
								stdNoIndex = stdNoCol;
								nameIndex = nameCol;
								accountNumberIndex = accountCol;
								bankNameIndex = bankCol;
								foundDataStart = true;
								continue;
							}
						}

						if (foundDataStart && row.length > 0) {
							const stdNo = row[stdNoIndex]?.toString().trim();
							const name = row[nameIndex]?.toString().trim();
							const accountNumber = row[accountNumberIndex]?.toString().trim();
							const bankName = row[bankNameIndex]?.toString().trim();

							if (
								stdNo &&
								name &&
								accountNumber &&
								bankName &&
								stdNo !== 'undefined' &&
								name !== 'undefined' &&
								accountNumber !== 'undefined' &&
								bankName !== 'undefined' &&
								stdNo.length > 0 &&
								name.length > 0 &&
								accountNumber.length > 0 &&
								bankName.length > 0
							) {
								rows.push({
									stdNo,
									name,
									accountNumber,
									bankName,
								});
							}
						}
					}

					if (!foundDataStart) {
						throw new Error(
							'Could not find required columns. Please ensure your Excel file has columns for Student No, Names, Account Number, and Bank Name.'
						);
					}

					if (rows.length === 0) {
						throw new Error('No valid data rows found in the Excel file.');
					}

					resolve(rows);
				} catch (error) {
					reject(error);
				}
			};
			reader.readAsBinaryString(file);
		});
	};

	const handleFileUpload = async (file: File | null) => {
		if (!file) {
			setImportData([]);
			return;
		}

		try {
			const data = await parseExcelFile(file);
			const processedData: ProcessedRow[] = data.map((row) => ({
				...row,
				status: 'pending',
			}));
			setImportData(processedData);
			setFile(file);
		} catch (_error) {
			notifications.show({
				title: 'Error',
				message: 'Failed to parse Excel file. Please check the format.',
				color: 'red',
				icon: <IconExclamationCircle size='1rem' />,
			});
		}
	};

	const processImport = async () => {
		if (importData.length === 0) return;

		setIsProcessing(true);
		setProgress(0);

		const requestData = importData.map((row) => ({
			stdNoOrName: row.stdNo,
			bankName: row.bankName,
			accountNumber: row.accountNumber,
		}));

		const allResults: UpdateResult[] = [];
		let processedCount = 0;
		const updatedData = [...importData];

		try {
			for (let i = 0; i < requestData.length; i += BATCH_SIZE) {
				const batch = requestData.slice(i, i + BATCH_SIZE);

				try {
					const batchResults = await updateMutation.mutateAsync({
						items: batch,
						batchSize: BATCH_SIZE,
					});

					batchResults.forEach((result, batchIndex) => {
						const overallIndex = i + batchIndex;
						if (result.success) {
							updatedData[overallIndex] = {
								...updatedData[overallIndex],
								status: 'success',
							};
						} else {
							updatedData[overallIndex] = {
								...updatedData[overallIndex],
								status: 'error',
								error: result.error || 'Failed to update',
							};
						}
					});

					allResults.push(...batchResults);
					processedCount += batch.length;

					const progressPercentage =
						(processedCount / requestData.length) * 100;
					setProgress(progressPercentage);
					setImportData([...updatedData]);

					await new Promise((resolve) => setTimeout(resolve, 50));
				} catch (_batchError) {
					for (let j = 0; j < batch.length; j++) {
						const overallIndex = i + j;
						if (overallIndex < updatedData.length) {
							updatedData[overallIndex] = {
								...updatedData[overallIndex],
								status: 'error',
								error: 'Batch processing failed',
							};
						}
					}
					setImportData([...updatedData]);
				}
			}

			const successCount = allResults.filter((r) => r.success).length;
			const errorCount = allResults.filter((r) => !r.success).length;

			notifications.show({
				title: 'Import Complete',
				message: `${successCount} records updated successfully, ${errorCount} failed out of ${requestData.length} total records.`,
				color: getBooleanColor(errorCount === 0),
				icon: <IconCheck size='1rem' />,
			});

			if (successCount > 0) {
				queryClient.invalidateQueries({ queryKey: ['all-sponsored-students'] });
			}
		} catch (_error) {
			notifications.show({
				title: 'Import Failed',
				message: 'An error occurred during the import process.',
				color: 'red',
				icon: <IconExclamationCircle size='1rem' />,
			});
		} finally {
			setIsProcessing(false);
			setProgress(100);
		}
	};

	const handleClose = () => {
		setFile(null);
		setImportData([]);
		setProgress(0);
		setIsProcessing(false);
		close();
	};

	const successCount = importData.filter(
		(row) => row.status === 'success'
	).length;
	const errorCount = importData.filter((row) => row.status === 'error').length;

	return (
		<>
			<Button
				leftSection={<IconUpload size='1rem' />}
				onClick={open}
				variant='light'
			>
				Import
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Import Account Details'
				size='md'
				centered
			>
				<Stack gap='md'>
					<Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
						Upload Excel file with: Student Number, Names, Account Number, Bank
						Name
					</Alert>

					<FileInput
						label='Excel File'
						placeholder='Select Excel file (.xlsx, .xls)'
						accept='.xlsx,.xls'
						value={file}
						onChange={handleFileUpload}
						disabled={isProcessing}
					/>

					{isProcessing && (
						<Stack gap='xs'>
							<Group justify='space-between'>
								<Text size='sm'>Processing...</Text>
								<Text size='xs' c='dimmed'>
									{Math.round(progress)}%
								</Text>
							</Group>
							<Progress value={progress} size='sm' />
						</Stack>
					)}

					{importData.length > 0 && !isProcessing && (
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								{importData.length} records ready
							</Text>
							<Group gap='xs'>
								{successCount > 0 && (
									<Badge color={statusColors.alert.success} size='sm'>
										{successCount} success
									</Badge>
								)}
								{errorCount > 0 && (
									<Badge color={statusColors.alert.error} size='sm'>
										{errorCount} errors
									</Badge>
								)}
							</Group>
						</Group>
					)}

					<Group justify='flex-end' gap='sm'>
						<Button
							variant='light'
							onClick={handleClose}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							onClick={processImport}
							disabled={importData.length === 0 || isProcessing}
							loading={isProcessing}
						>
							Import {importData.length > 0 ? importData.length : ''} Records
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
