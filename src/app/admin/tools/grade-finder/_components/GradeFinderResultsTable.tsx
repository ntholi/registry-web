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
import { getGradeColor } from '@/shared/lib/utils/colors';
import { formatSemester } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import type { GradeFinderResult } from '../_server/repository';

interface Props {
	data: GradeFinderResult[];
	isLoading: boolean;
	total: number;
	pages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onSearchChange: (search: string) => void;
	onExport: () => Promise<GradeFinderResult[]>;
}

function getClassName(programCode: string, semesterNumber: string) {
	return `${programCode}${formatSemester(semesterNumber, 'mini')}`;
}

export function GradeFinderResultsTable({
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
			const worksheet = workbook.addWorksheet('Grade Finder Results');

			worksheet.columns = [
				{ header: 'Student No.', key: 'stdNo', width: 15 },
				{ header: 'Student Name', key: 'studentName', width: 30 },
				{ header: 'Module Code', key: 'moduleCode', width: 15 },
				{ header: 'Module Name', key: 'moduleName', width: 35 },
				{ header: 'Grade', key: 'grade', width: 10 },
				{ header: 'Term', key: 'termCode', width: 12 },
				{ header: 'Class', key: 'class', width: 15 },
				{ header: 'School', key: 'schoolCode', width: 10 },
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
					moduleCode: row.moduleCode,
					moduleName: row.moduleName,
					grade: row.grade,
					termCode: row.termCode,
					class: getClassName(row.programCode, row.semesterNumber),
					schoolCode: row.schoolCode,
				});
			}

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `grade_finder_${new Date().toISOString().split('T')[0]}.xlsx`;
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
							placeholder='Search by student name or module...'
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
							No results found. Try adjusting your filters.
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
						placeholder='Search by student name or module...'
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
								<Table.Th>Module</Table.Th>
								<Table.Th ta='center'>Grade</Table.Th>
								<Table.Th>Term</Table.Th>
								<Table.Th>Class</Table.Th>
								<Table.Th>School</Table.Th>
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
												<Skeleton height={14} width='70%' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={30} mx='auto' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={70} />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={80} />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={50} />
											</Table.Td>
										</Table.Tr>
									))
								: data.map((row, idx) => (
										<Table.Tr key={`${row.stdNo}-${row.moduleCode}-${idx}`}>
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
													{row.moduleCode}
												</Text>
												<Text size='xs' c='dimmed' lineClamp={1}>
													{row.moduleName}
												</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Badge variant='light' color={getGradeColor(row.grade)}>
													{row.grade}
												</Badge>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.termCode}</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>
													{getClassName(row.programCode, row.semesterNumber)}
												</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.schoolCode}</Text>
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
