'use client';

import {
	Badge,
	Box,
	Button,
	Group,
	Loader,
	Pagination,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { IconDownload, IconSearch } from '@tabler/icons-react';
import ExcelJS from 'exceljs';
import { useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import type { CGPAFinderResult } from '../_server/cgpa-repository';

interface Props {
	data: CGPAFinderResult[];
	isLoading: boolean;
	total: number;
	pages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onSearchChange: (search: string) => void;
	onExport: () => Promise<CGPAFinderResult[]>;
}

function formatCGPA(cgpa: number) {
	return cgpa.toFixed(2);
}

function getCGPAColor(cgpa: number) {
	if (cgpa >= 3.5) return 'green';
	if (cgpa >= 3.0) return 'teal';
	if (cgpa >= 2.5) return 'blue';
	if (cgpa >= 2.0) return 'yellow';
	return 'red';
}

export function CGPAFinderResultsTable({
	data,
	isLoading,
	total,
	pages,
	currentPage,
	onPageChange,
	onSearchChange,
	onExport,
}: Props) {
	const [searchValue, setSearchValue] = useState('');
	const [isExporting, setIsExporting] = useState(false);

	function handleSearchChange(value: string) {
		setSearchValue(value);
		onSearchChange(value);
	}

	async function handleExport() {
		setIsExporting(true);
		try {
			const results = await onExport();
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('CGPA Finder Results');

			worksheet.columns = [
				{ header: 'Student No.', key: 'stdNo', width: 15 },
				{ header: 'Student Name', key: 'studentName', width: 30 },
				{ header: 'Program Code', key: 'programCode', width: 15 },
				{ header: 'Program Name', key: 'programName', width: 40 },
				{ header: 'School', key: 'schoolCode', width: 10 },
				{ header: 'GPA', key: 'gpa', width: 10 },
				{ header: 'CGPA', key: 'cgpa', width: 10 },
				{ header: 'Semester', key: 'semesterCount', width: 10 },
				{ header: 'Latest Term', key: 'latestTermCode', width: 12 },
			];

			const headerRow = worksheet.getRow(1);
			headerRow.font = { bold: true };
			headerRow.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE0E0E0' },
			};

			for (const row of results) {
				worksheet.addRow({
					stdNo: row.stdNo,
					studentName: row.studentName,
					programCode: row.programCode,
					programName: row.programName,
					schoolCode: row.schoolCode,
					gpa: formatCGPA(row.gpa),
					cgpa: formatCGPA(row.cgpa),
					semesterCount: row.semesterCount,
					latestTermCode: row.latestTermCode,
				});
			}

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `cgpa_finder_${new Date().toISOString().split('T')[0]}.xlsx`;
			link.click();
			URL.revokeObjectURL(url);
		} finally {
			setIsExporting(false);
		}
	}

	if (!data.length && !isLoading) {
		return (
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<Group gap='sm'>
						<TextInput
							placeholder='Search by student name or program...'
							leftSection={<IconSearch size={16} />}
							value={searchValue}
							onChange={(e) => handleSearchChange(e.currentTarget.value)}
							size='sm'
							style={{ flex: 1 }}
						/>
						<Button
							size='sm'
							variant='light'
							leftSection={<IconDownload size={16} />}
							onClick={handleExport}
							loading={isExporting}
							disabled
						>
							Export
						</Button>
					</Group>
					<Box py='xl' ta='center'>
						<Text c='dimmed'>
							No results found. Try adjusting your CGPA range or filters.
						</Text>
					</Box>
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Group gap='sm'>
					<TextInput
						placeholder='Search by student name or program...'
						leftSection={<IconSearch size={16} />}
						rightSection={isLoading ? <Loader size='xs' /> : null}
						value={searchValue}
						onChange={(e) => handleSearchChange(e.currentTarget.value)}
						size='sm'
						style={{ flex: 1 }}
					/>
					<Button
						size='sm'
						variant='light'
						leftSection={<IconDownload size={16} />}
						onClick={handleExport}
						loading={isExporting}
						disabled={total === 0}
					>
						Export
					</Button>
				</Group>

				<ScrollArea>
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Student No.</Table.Th>
								<Table.Th>Student Name</Table.Th>
								<Table.Th>Program</Table.Th>
								<Table.Th>School</Table.Th>
								<Table.Th ta='center'>GPA</Table.Th>
								<Table.Th ta='center'>CGPA</Table.Th>
								<Table.Th ta='center'>Semester</Table.Th>
								<Table.Th>Latest Term</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{isLoading
								? Array.from({ length: 10 }).map((_, i) => (
										<Table.Tr key={`skeleton-${i}`}>
											<Table.Td>
												<Skeleton height={14} width={70} />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width='80%' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width='60%' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={50} />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={40} mx='auto' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={40} mx='auto' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={30} mx='auto' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={70} />
											</Table.Td>
										</Table.Tr>
									))
								: data.map((row) => (
										<Table.Tr key={row.stdNo}>
											<Table.Td>
												<Link
													href={`/registry/students/${row.stdNo}`}
													size='sm'
													fw={500}
												>
													{row.stdNo}
												</Link>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.studentName}</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm' fw={500}>
													{row.programCode}
												</Text>
												<Text size='xs' c='dimmed' lineClamp={1}>
													{row.programName}
												</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.schoolCode}</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Text size='sm'>{formatCGPA(row.gpa)}</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Badge variant='light' color={getCGPAColor(row.cgpa)}>
													{formatCGPA(row.cgpa)}
												</Badge>
											</Table.Td>
											<Table.Td ta='center'>
												<Badge variant='light' size='sm'>
													{formatSemester(String(row.semesterCount), 'mini')}
												</Badge>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.latestTermCode}</Text>
											</Table.Td>
										</Table.Tr>
									))}
						</Table.Tbody>
					</Table>
				</ScrollArea>

				<Group justify='space-between' wrap='wrap'>
					<Text size='sm' c='dimmed'>
						Showing {data.length} of {total} result{total !== 1 ? 's' : ''}
					</Text>

					{pages > 1 && (
						<Pagination
							total={pages}
							value={currentPage}
							onChange={onPageChange}
							size='sm'
						/>
					)}
				</Group>
			</Stack>
		</Paper>
	);
}
