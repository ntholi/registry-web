'use client';

import { getAllPrograms } from '@academic/schools';
import { getStructuresByProgramId } from '@academic/structures';
import { ActionIcon, Modal, Popover, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type {
	gender as genderEnum,
	maritalStatusEnum,
	nextOfKinRelationship,
	programStatus,
} from '@registry/_database';
import { IconFileSpreadsheet } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { getAllTerms } from '@/app/registry/terms';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import {
	type CreateFullStudentInput,
	createFullStudent,
} from '../../_server/actions';
import {
	ColumnMappingStep,
	FileSelectStep,
	PreviewStep,
	ProgressStep,
} from './ImportSteps';
import { autoMapColumns, extractRows } from './parse-utils';
import type { ColumnMapping, ImportProgress, ParsedStudent } from './types';

export default function ImportStudentsModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const [step, setStep] = useState(0);
	const [headers, setHeaders] = useState<string[]>([]);
	const [rawRows, setRawRows] = useState<
		(string | number | null | undefined)[][]
	>([]);
	const [mapping, setMapping] = useState<ColumnMapping>({});
	const [students, setStudents] = useState<ParsedStudent[]>([]);
	const [progress, setProgress] = useState<ImportProgress | null>(null);
	const [structureId, setStructureId] = useState<string | null>(null);
	const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
		null
	);
	const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
	const abortRef = useRef(false);
	const queryClient = useQueryClient();
	const { activeTerm } = useActiveTerm();

	const { data: programs = [] } = useQuery({
		queryKey: ['all-programs'],
		queryFn: getAllPrograms,
	});

	const programId = selectedProgramId ? Number(selectedProgramId) : null;

	const { data: structures = [], isLoading: loadingStructures } = useQuery({
		queryKey: ['structures', programId],
		queryFn: () => (programId ? getStructuresByProgramId(programId) : []),
		enabled: !!programId,
	});

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const programOptions = useMemo(
		() => programs.map((p) => ({ value: p.id.toString(), label: p.name })),
		[programs]
	);

	const structureOptions = useMemo(
		() => structures.map((s) => ({ value: s.id.toString(), label: s.code })),
		[structures]
	);

	const termOptions = useMemo(
		() => terms.map((t) => ({ value: t.code, label: t.code })),
		[terms]
	);

	function reset() {
		setStep(0);
		setHeaders([]);
		setRawRows([]);
		setMapping({});
		setStudents([]);
		setProgress(null);
		setStructureId(null);
		setSelectedProgramId(null);
		setSelectedTerm(activeTerm?.code ?? null);
		abortRef.current = false;
	}

	function handleClose() {
		abortRef.current = true;
		reset();
		close();
	}

	function handleOpen() {
		reset();
		setSelectedTerm(activeTerm?.code ?? null);
		open();
	}

	function handleFileSelect(file: File | null) {
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const jsonData = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
					raw: true,
				}) as (string | number | null | undefined)[][];

				if (jsonData.length < 2) {
					notifications.show({
						title: 'Error',
						message: 'File must have at least a header row and one data row',
						color: 'red',
					});
					return;
				}

				const hdrs = jsonData[0].map((h) => String(h ?? ''));
				const rows = jsonData
					.slice(1)
					.filter((row) =>
						row.some((cell) => cell != null && String(cell).trim() !== '')
					);

				setHeaders(hdrs);
				setRawRows(rows);

				const autoMapping = autoMapColumns(hdrs);
				setMapping(autoMapping);

				const courseCol = Object.entries(autoMapping).find(
					([, v]) => v === 'courseOfStudy'
				);
				if (courseCol && programs.length > 0) {
					const sampleCourse = String(
						rows[0]?.[Number(courseCol[0])] ?? ''
					).trim();
					if (sampleCourse) {
						const match = programs.find(
							(p) =>
								p.name.toLowerCase() === sampleCourse.toLowerCase() ||
								p.name.toLowerCase().includes(sampleCourse.toLowerCase()) ||
								sampleCourse.toLowerCase().includes(p.name.toLowerCase())
						);
						if (match) {
							setSelectedProgramId(match.id.toString());
						}
					}
				}

				setStep(1);
			} catch {
				notifications.show({
					title: 'Error',
					message: 'Failed to parse file. Ensure it is a valid Excel file.',
					color: 'red',
				});
			}
		};
		reader.readAsArrayBuffer(file);
	}

	function handleMappingChange(colIndex: number, fieldKey: string) {
		setMapping((prev) => ({ ...prev, [colIndex]: fieldKey }));
	}

	function handlePreview() {
		const parsed = extractRows(rawRows, headers, mapping);
		setStudents(parsed);
		setStep(2);
	}

	const autoSelectStructure = useCallback((pid: string) => {
		const id = Number(pid);
		if (!id) return;
		getStructuresByProgramId(id).then((structs) => {
			const latest = structs.at(-1);
			if (latest) setStructureId(latest.id.toString());
		});
	}, []);

	async function handleImport() {
		if (!structureId) {
			notifications.show({
				title: 'Error',
				message: 'Please select a program and structure',
				color: 'red',
			});
			return;
		}

		abortRef.current = false;
		const prog: ImportProgress = {
			total: students.length,
			completed: 0,
			succeeded: 0,
			failed: 0,
			results: [],
		};
		setProgress(prog);
		setStep(3);

		for (let i = 0; i < students.length; i++) {
			if (abortRef.current) break;

			const s = students[i];
			try {
				const input: CreateFullStudentInput = {
					student: {
						name: s.name,
						nationalId: s.nationalId || undefined,
						dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : undefined,
						phone1: s.phone1 || null,
						phone2: s.phone2 || null,
						gender:
							(s.gender as (typeof genderEnum.enumValues)[number]) || null,
						maritalStatus:
							(s.maritalStatus as (typeof maritalStatusEnum.enumValues)[number]) ||
							null,
						country: s.country || null,
						nationality: s.nationality || null,
						birthPlace: s.birthPlace || null,
						religion: s.religion || null,
						race: s.race || null,
						status: 'Active',
					},
					nextOfKins: s.kinName
						? [
								{
									name: s.kinName,
									relationship:
										'Guardian' as (typeof nextOfKinRelationship.enumValues)[number],
									phone: s.kinPhone || null,
									email: null,
									occupation: null,
									address: null,
									country: null,
								},
							]
						: [],
					program: {
						structureId: Number(structureId),
						status: 'Active' as (typeof programStatus.enumValues)[number],
						intakeDate: formatDateToISO(new Date()) || null,
						regDate: formatDateToISO(new Date()) || null,
						startTerm: selectedTerm || null,
						stream: null,
					},
				};

				const created = await createFullStudent(input);
				prog.succeeded++;
				prog.results.push({
					row: i + 1,
					name: s.name,
					stdNo: created.stdNo,
				});
			} catch (err) {
				prog.failed++;
				prog.results.push({
					row: i + 1,
					name: s.name,
					error: String(err),
				});
			}

			prog.completed++;
			setProgress({ ...prog });
		}

		queryClient.invalidateQueries({ queryKey: ['students'] });

		if (!abortRef.current) {
			notifications.show({
				title: 'Import Complete',
				message: `${prog.succeeded} students created, ${prog.failed} failed`,
				color: prog.failed === 0 ? 'green' : 'yellow',
			});
		}
	}

	const mappedCount = Object.values(mapping).filter(
		(v) => v !== '_skip'
	).length;
	const pct = progress
		? Math.round((progress.completed / progress.total) * 100)
		: 0;

	return (
		<>
			<Popover withArrow position='bottom'>
				<Popover.Target>
					<ActionIcon variant='default' onClick={handleOpen}>
						<IconFileSpreadsheet size='1.25rem' />
					</ActionIcon>
				</Popover.Target>
				<Popover.Dropdown>
					<Text size='xs'>Import students from Excel</Text>
				</Popover.Dropdown>
			</Popover>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Import Students from Excel'
				size='xl'
				closeOnClickOutside={step !== 3}
				closeOnEscape={step !== 3}
			>
				{step === 0 && <FileSelectStep onFileSelect={handleFileSelect} />}

				{step === 1 && (
					<ColumnMappingStep
						headers={headers}
						rawRows={rawRows}
						mapping={mapping}
						mappedCount={mappedCount}
						onMappingChange={handleMappingChange}
						onBack={() => setStep(0)}
						onNext={handlePreview}
					/>
				)}

				{step === 2 && (
					<PreviewStep
						students={students}
						programOptions={programOptions}
						structureOptions={structureOptions}
						termOptions={termOptions}
						selectedProgramId={selectedProgramId}
						structureId={structureId}
						selectedTerm={selectedTerm}
						loadingStructures={loadingStructures}
						onProgramChange={(v) => {
							setSelectedProgramId(v);
							setStructureId(null);
							if (v) autoSelectStructure(v);
						}}
						onStructureChange={setStructureId}
						onTermChange={setSelectedTerm}
						onBack={() => setStep(1)}
						onImport={handleImport}
					/>
				)}

				{step === 3 && progress && (
					<ProgressStep
						progress={progress}
						pct={pct}
						onClose={handleClose}
						onAbort={() => {
							abortRef.current = true;
						}}
					/>
				)}
			</Modal>
		</>
	);
}
