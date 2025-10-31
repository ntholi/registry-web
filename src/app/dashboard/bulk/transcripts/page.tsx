'use client';

import {
	Box,
	Button,
	Center,
	Checkbox,
	Flex,
	Group,
	Loader,
	Paper,
	Progress,
	Select,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { Document, pdf } from '@react-pdf/renderer';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
	getDistinctGraduationDates,
	getProgramsByGraduationDate,
	getStudentsByGraduationDate,
} from '@/server/bulk/transcripts/actions';
import type { getAcademicHistory } from '@/server/students/actions';
import { TranscriptPages } from '../../students/[id]/graduation/transcript/TranscriptPDF';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

function formatGraduationDate(date: string) {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return date;
	return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function parseMonthYear(formattedDate: string) {
	const parts = formattedDate.split(' ');
	if (parts.length !== 2) return null;
	const [month, year] = parts;
	const monthIndex = new Date(`${month} 1, 2000`).getMonth();
	return { month: monthIndex, year: parseInt(year, 10) };
}

export default function ExportTranscriptPage() {
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState('');

	const { data: graduationDates, isLoading: isDatesLoading } = useQuery({
		queryKey: ['distinctGraduationDates'],
		queryFn: getDistinctGraduationDates,
	});

	const { data: programs, isLoading: isProgramsLoading } = useQuery({
		queryKey: ['programsByGraduationDate', selectedDate],
		queryFn: () => getProgramsByGraduationDate(selectedDate!),
		enabled: !!selectedDate,
	});

	const groupedDates = graduationDates?.reduce(
		(acc, date) => {
			const formatted = formatGraduationDate(date);
			const parsed = parseMonthYear(formatted);
			if (!parsed) return acc;

			const key = `${parsed.year}-${String(parsed.month + 1).padStart(2, '0')}`;
			if (!acc[key]) {
				acc[key] = {
					label: formatted,
					dates: [],
				};
			}
			acc[key].dates.push(date);
			return acc;
		},
		{} as Record<string, { label: string; dates: string[] }>
	);

	const selectOptions =
		groupedDates &&
		Object.values(groupedDates).map((group) => ({
			value: group.dates.join(','),
			label: group.label,
		}));

	function handleDateChange(value: string | null) {
		setSelectedDate(value);
		setSelectedProgramIds([]);
		setProgress(0);
		setProgressText('');
	}

	function handleProgramToggle(programId: number) {
		setSelectedProgramIds((prev) =>
			prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
		);
	}

	function handleSelectAllPrograms() {
		if (!programs) return;
		if (selectedProgramIds.length === programs.length) {
			setSelectedProgramIds([]);
		} else {
			setSelectedProgramIds(programs.map((p) => p.programId));
		}
	}

	async function handleExport() {
		if (!selectedDate) return;
		if (selectedProgramIds.length === 0) {
			alert('Please select at least one program');
			return;
		}

		setIsGenerating(true);
		setProgress(0);
		setProgressText('Fetching students...');

		try {
			const dates = selectedDate.split(',');
			const allStudents = [];

			for (const date of dates) {
				const students = await getStudentsByGraduationDate(date.trim(), selectedProgramIds);
				allStudents.push(...students);
			}

			if (allStudents.length === 0) {
				alert('No students found for the selected graduation date and programs');
				setProgress(0);
				setProgressText('');
				setIsGenerating(false);
				return;
			}

			const studentsByProgram = allStudents.reduce(
				(acc, student) => {
					const graduatedProgram = student.programs?.find(
						(program) => program.graduationDate && dates.includes(program.graduationDate)
					);

					if (graduatedProgram) {
						const programId = graduatedProgram.structure.program.id;
						const programName = graduatedProgram.structure.program.name;
						const programCode = graduatedProgram.structure.program.code;

						if (!acc[programId]) {
							acc[programId] = {
								programId,
								programName,
								programCode,
								students: [],
							};
						}
						acc[programId].students.push(student);
					}

					return acc;
				},
				{} as Record<
					number,
					{
						programId: number;
						programName: string;
						programCode: string;
						students: Student[];
					}
				>
			);

			const programGroups = Object.values(studentsByProgram);

			if (programGroups.length === 0) {
				alert('No students found with matching graduation programs');
				setProgress(0);
				setProgressText('');
				setIsGenerating(false);
				return;
			}

			setProgress(20);
			setProgressText(`Generating ${programGroups.length} program PDFs...`);

			const pdfPromises = programGroups.map(async (program, index) => {
				const progressOffset = (index / programGroups.length) * 60;
				setProgress(20 + progressOffset);
				setProgressText(`Generating ${program.programName} transcripts...`);

				const pdfDocument = (
					<Document key={program.programId}>
						{program.students.map((student, studentIndex) => (
							<TranscriptPages
								key={`${student.stdNo}-${studentIndex}`}
								student={student}
								studentIndex={studentIndex}
							/>
						))}
					</Document>
				);

				const pdfInstance = pdf(pdfDocument);
				const blob = await pdfInstance.toBlob();

				return {
					programName: program.programName,
					programCode: program.programCode,
					blob,
					studentCount: program.students.length,
				};
			});

			setProgress(50);
			setProgressText('Rendering PDF documents...');

			const pdfResults = await Promise.all(pdfPromises);

			setProgress(85);
			setProgressText('Preparing downloads...');

			const dateLabel = selectOptions
				?.find((opt) => opt.value === selectedDate)
				?.label.replace(/\s+/g, '-');
			pdfResults.forEach((pdfResult) => {
				const url = URL.createObjectURL(pdfResult.blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `transcripts-${pdfResult.programCode}-${dateLabel}.pdf`;
				link.click();
				URL.revokeObjectURL(url);
			});

			setProgress(100);
			setProgressText(
				`Download complete! Generated ${pdfResults.length} PDF files with ${allStudents.length} transcripts.`
			);

			setTimeout(() => {
				setProgress(0);
				setProgressText('');
			}, 3000);
		} catch (error) {
			console.error('Error generating transcripts:', error);
			const errorMessage =
				error instanceof Error
					? error.message
					: 'An error occurred while generating the transcripts';
			alert(`Failed to generate transcripts: ${errorMessage}`);
			setProgress(0);
			setProgressText('');
		} finally {
			setIsGenerating(false);
		}
	}

	if (isDatesLoading) {
		return (
			<Center h={400}>
				<Loader size='lg' />
			</Center>
		);
	}

	return (
		<Box p='md'>
			<Stack gap='md'>
				<Text size='xl' fw={700}>
					Bulk Export Transcripts
				</Text>

				<Text size='sm' c='dimmed'>
					Select a graduation date and programs to export transcripts for students who graduated in
					that month and year.
				</Text>

				<Flex align={'end'} gap='md'>
					<Select
						flex={10}
						label='Graduation Date'
						placeholder='Select a graduation date'
						data={selectOptions || []}
						value={selectedDate}
						onChange={handleDateChange}
						searchable
						disabled={isGenerating}
					/>
					<Button
						flex={2}
						leftSection={<IconDownload size='1rem' />}
						onClick={handleExport}
						disabled={!selectedDate || selectedProgramIds.length === 0 || isGenerating}
						loading={isGenerating}
					>
						{isGenerating ? 'Generating...' : 'Export Transcripts'}
					</Button>
				</Flex>
				{selectedDate && isProgramsLoading && (
					<Center>
						<Loader size='sm' />
					</Center>
				)}

				{selectedDate && programs && programs.length > 0 && (
					<Paper p='md' withBorder>
						<Stack gap='sm'>
							<Group justify='space-between'>
								<Text size='sm' fw={500}>
									Select Programs
								</Text>
								<Button
									size='xs'
									variant='subtle'
									onClick={handleSelectAllPrograms}
									disabled={isGenerating}
								>
									{selectedProgramIds.length === programs.length ? 'Deselect All' : 'Select All'}
								</Button>
							</Group>

							<SimpleGrid cols={2}>
								{programs.map((program) => (
									<Checkbox
										key={program.programId}
										label={`${program.programName} (${program.programCode})`}
										checked={selectedProgramIds.includes(program.programId)}
										onChange={() => handleProgramToggle(program.programId)}
										disabled={isGenerating}
									/>
								))}
							</SimpleGrid>

							<Text size='xs' c='dimmed'>
								{selectedProgramIds.length} of {programs.length} programs selected
							</Text>
						</Stack>
					</Paper>
				)}

				{selectedDate && programs && programs.length === 0 && (
					<Text size='sm' c='dimmed'>
						No programs found for the selected graduation date.
					</Text>
				)}

				{isGenerating && progress > 0 && (
					<Paper p='md' withBorder>
						<Stack gap='sm'>
							<Text size='sm' fw={500}>
								{progressText}
							</Text>
							<Progress value={progress} animated />
						</Stack>
					</Paper>
				)}
			</Stack>
		</Box>
	);
}
