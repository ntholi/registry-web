import type { UserSlot } from '@timetable/slots';
import {
	AlignmentType,
	BorderStyle,
	Document,
	HeadingLevel,
	Packer,
	PageOrientation,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	VerticalAlign,
	WidthType,
} from 'docx';
import { getStudentClassName } from '@/shared/lib/utils/utils';

type ClassType = 'lecture' | 'tutorial' | 'practical' | 'workshop' | 'seminar';

const TIME_SLOTS = [
	{ start: '08:30', end: '10:30' },
	{ start: '10:30', end: '12:30' },
	{ start: '12:30', end: '14:30' },
	{ start: '14:30', end: '16:30' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
	monday: 'Monday',
	tuesday: 'Tuesday',
	wednesday: 'Wednesday',
	thursday: 'Thursday',
	friday: 'Friday',
};

type SlotAllocation = {
	slotId: number;
	timetableAllocationId: number;
	createdAt: Date | null;
	timetableAllocation: {
		classType: ClassType;
		groupName: string | null;
		semesterModule: {
			moduleId: number;
			module: {
				code: string;
				name: string;
			};
			semester?: {
				semesterNumber: string;
				structure?: {
					program: {
						code: string;
					};
				};
			} | null;
		};
		user: {
			name: string | null;
		};
	};
};

type GroupedModule = {
	moduleCode: string;
	moduleName: string;
	classType: ClassType;
	venueName: string;
	classNames: string[];
	lecturerNames: string[];
};

function groupAllocationsByModule(
	slot: UserSlot,
	allocations: SlotAllocation[]
): GroupedModule[] {
	const moduleMap = new Map<number, GroupedModule>();

	for (const slotAllocation of allocations) {
		const allocation = slotAllocation.timetableAllocation;
		const moduleId = allocation.semesterModule.moduleId;
		const moduleName = allocation.semesterModule.module.name;
		const moduleCode = allocation.semesterModule.module.code;
		const classType = allocation.classType;
		const className = getStudentClassName(
			allocation.semesterModule.semester,
			allocation.groupName
		);
		const lecturerName = allocation.user.name || 'Unknown';

		if (moduleMap.has(moduleId)) {
			const existing = moduleMap.get(moduleId)!;
			if (!existing.classNames.includes(className)) {
				existing.classNames.push(className);
			}
			if (!existing.lecturerNames.includes(lecturerName)) {
				existing.lecturerNames.push(lecturerName);
			}
		} else {
			moduleMap.set(moduleId, {
				moduleCode,
				moduleName,
				classType,
				venueName: slot.venue?.name || '',
				classNames: [className],
				lecturerNames: [lecturerName],
			});
		}
	}

	return Array.from(moduleMap.values());
}

function getTimeSlotIndex(time: string): number {
	const [h, m] = time.split(':').map(Number);
	const minutes = h * 60 + m;

	for (let i = 0; i < TIME_SLOTS.length; i++) {
		const [startH, startM] = TIME_SLOTS[i].start.split(':').map(Number);
		const slotStart = startH * 60 + startM;

		if (minutes === slotStart) {
			return i;
		}
	}
	return -1;
}

function getEndTimeSlotIndex(time: string): number {
	const [h, m] = time.split(':').map(Number);
	const minutes = h * 60 + m;

	for (let i = 0; i < TIME_SLOTS.length; i++) {
		const [endH, endM] = TIME_SLOTS[i].end.split(':').map(Number);
		const slotEnd = endH * 60 + endM;

		if (minutes === slotEnd) {
			return i;
		}
	}
	return -1;
}

function getTimeSlotSpan(startTime: string, endTime: string): number {
	const startIdx = getTimeSlotIndex(startTime);
	const endIdx = getEndTimeSlotIndex(endTime);

	if (startIdx === -1) return 1;
	if (endIdx === -1) return 1;

	return endIdx - startIdx + 1;
}

type ShowOptions = {
	showVenue: boolean;
	showLecturer: boolean;
	showClass: boolean;
};

function createCellContent(
	modules: GroupedModule[],
	options: ShowOptions
): Paragraph[] {
	if (modules.length === 0) {
		return [new Paragraph({ text: '' })];
	}

	const paragraphs: Paragraph[] = [];

	for (const mod of modules) {
		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text: mod.moduleName,
						bold: true,
						size: 18,
						color: '1e1e1e',
					}),
					new TextRun({
						text: ` (${mod.moduleCode})`,
						size: 16,
						color: '1f2937',
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 60 },
			})
		);

		paragraphs.push(
			new Paragraph({
				children: [
					new TextRun({
						text:
							mod.classType.charAt(0).toUpperCase() + mod.classType.slice(1),
						size: 16,
						color: '134e4a',
						bold: true,
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 60 },
			})
		);

		const details: string[] = [];
		if (options.showVenue && mod.venueName) {
			details.push(mod.venueName);
		}
		if (options.showLecturer && mod.lecturerNames.length > 0) {
			details.push(mod.lecturerNames.join(', '));
		}
		if (options.showClass && mod.classNames.length > 0) {
			details.push(mod.classNames.join(', '));
		}

		if (details.length > 0) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: details.join(' | '),
							size: 14,
							color: '1f2937',
						}),
					],
					alignment: AlignmentType.CENTER,
					spacing: { after: 80 },
				})
			);
		}
	}

	return paragraphs;
}

function createTimetableTable(slots: UserSlot[], options: ShowOptions): Table {
	const borderStyle = {
		style: BorderStyle.SINGLE,
		size: 1,
		color: 'd1d5db',
	};

	const headerCells = [
		new TableCell({
			children: [
				new Paragraph({
					children: [new TextRun({ text: '', bold: true, size: 20 })],
					alignment: AlignmentType.CENTER,
				}),
			],
			width: { size: 1200, type: WidthType.DXA },
			shading: { fill: 'e5e7eb' },
			verticalAlign: VerticalAlign.CENTER,
			borders: {
				top: borderStyle,
				bottom: borderStyle,
				left: borderStyle,
				right: borderStyle,
			},
		}),
		...TIME_SLOTS.map(
			(ts) =>
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: `${ts.start} - ${ts.end}`,
									bold: true,
									size: 18,
								}),
							],
							alignment: AlignmentType.CENTER,
						}),
					],
					width: { size: 2200, type: WidthType.DXA },
					shading: { fill: 'e5e7eb' },
					verticalAlign: VerticalAlign.CENTER,
					borders: {
						top: borderStyle,
						bottom: borderStyle,
						left: borderStyle,
						right: borderStyle,
					},
				})
		),
	];

	const rows = [new TableRow({ children: headerCells, tableHeader: true })];

	for (const day of DAYS) {
		const daySlots = slots
			.filter((s) => s.dayOfWeek === day)
			.sort((a, b) => a.startTime.localeCompare(b.startTime));

		const cellContents: {
			colStart: number;
			colSpan: number;
			modules: GroupedModule[];
		}[] = [];
		const coveredCols = new Set<number>();

		for (const slot of daySlots) {
			const colStart = getTimeSlotIndex(slot.startTime);
			const colSpan = getTimeSlotSpan(slot.startTime, slot.endTime);

			if (colStart === -1) continue;

			const modules = groupAllocationsByModule(
				slot,
				slot.timetableSlotAllocations as unknown as SlotAllocation[]
			);
			cellContents.push({ colStart, colSpan, modules });

			for (
				let i = colStart;
				i < colStart + colSpan && i < TIME_SLOTS.length;
				i++
			) {
				coveredCols.add(i);
			}
		}

		const cells: TableCell[] = [
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: DAY_LABELS[day],
								bold: true,
								size: 18,
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 1200, type: WidthType.DXA },
				shading: { fill: 'f3f4f6' },
				verticalAlign: VerticalAlign.CENTER,
				borders: {
					top: borderStyle,
					bottom: borderStyle,
					left: borderStyle,
					right: borderStyle,
				},
			}),
		];

		let col = 0;
		while (col < TIME_SLOTS.length) {
			const content = cellContents.find((c) => c.colStart === col);

			if (content) {
				cells.push(
					new TableCell({
						children: createCellContent(content.modules, options),
						columnSpan: content.colSpan,
						verticalAlign: VerticalAlign.CENTER,
						borders: {
							top: borderStyle,
							bottom: borderStyle,
							left: borderStyle,
							right: borderStyle,
						},
						margins: {
							top: 100,
							bottom: 100,
							left: 100,
							right: 100,
						},
					})
				);
				col += content.colSpan;
			} else {
				cells.push(
					new TableCell({
						children: [new Paragraph({ text: '' })],
						verticalAlign: VerticalAlign.CENTER,
						borders: {
							top: borderStyle,
							bottom: borderStyle,
							left: borderStyle,
							right: borderStyle,
						},
					})
				);
				col += 1;
			}
		}

		rows.push(
			new TableRow({
				children: cells,
				height: { value: 1200, rule: 'atLeast' as const },
			})
		);
	}

	return new Table({
		rows,
		width: { size: 100, type: WidthType.PERCENTAGE },
	});
}

type TimetableEntry = {
	name: string;
	slots: UserSlot[];
};

type GenerateOptions = {
	entries: TimetableEntry[];
	showVenue: boolean;
	showLecturer: boolean;
	showClass: boolean;
	termCode: string;
};

export function generateTimetableDocx(options: GenerateOptions): Promise<Blob> {
	const { entries, showVenue, showLecturer, showClass, termCode } = options;

	const sections = entries.map((entry) => ({
		properties: {
			page: {
				size: {
					orientation: PageOrientation.LANDSCAPE,
				},
				margin: {
					top: 720,
					right: 720,
					bottom: 720,
					left: 720,
				},
			},
		},
		children: [
			new Paragraph({
				children: [
					new TextRun({
						text: entry.name,
						bold: true,
						size: 32,
					}),
				],
				heading: HeadingLevel.HEADING_1,
				alignment: AlignmentType.CENTER,
				spacing: { after: 100 },
			}),
			new Paragraph({
				children: [
					new TextRun({
						text: termCode,
						size: 22,
						color: '374151',
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 300 },
			}),
			createTimetableTable(entry.slots, { showVenue, showLecturer, showClass }),
		],
	}));

	const doc = new Document({ sections });

	return Packer.toBlob(doc);
}
