import fs from 'node:fs';
import path from 'node:path';
import {
	AlignmentType,
	BorderStyle,
	Document,
	Footer,
	ImageRun,
	PageOrientation,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	WidthType,
} from 'docx';
import { formatSemester } from '@/lib/utils';
import type {
	FullRegistrationReport,
	SummaryRegistrationReport,
} from './repository';

function getLogoImage(): Buffer {
	if (typeof window === 'undefined') {
		const logoPath = path.join(
			process.cwd(),
			'public',
			'images',
			'logo-lesotho.jpg'
		);
		try {
			return fs.readFileSync(logoPath);
		} catch (error) {
			console.error('Error reading logo file:', error);
			return Buffer.from('');
		}
	}
	return Buffer.from('');
}

export function createFullRegistrationDocument(
	report: FullRegistrationReport
): Document {
	const logoImage = getLogoImage();

	const headerParagraphs: Paragraph[] = [];

	if (logoImage.length > 0) {
		headerParagraphs.push(
			new Paragraph({
				children: [
					new ImageRun({
						data: logoImage,
						transformation: {
							width: 360,
							height: 180,
						},
						type: 'jpg',
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 400 },
			})
		);
	}

	headerParagraphs.push(
		new Paragraph({
			children: [
				new TextRun({
					text: 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY',
					font: 'Arial',
					bold: true,
					size: 28,
					color: '000000',
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 200 },
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: 'REGISTRY DEPARTMENT',
					font: 'Arial',
					bold: true,
					size: 22,
					color: '333333',
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 300 },
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: 'FULL REGISTRATION REPORT',
					font: 'Arial',
					bold: true,
					size: 24,
					color: '000000',
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 480 },
		})
	);

	const doc = new Document({
		creator: 'Limkokwing University Registry System',
		title: `Full Registration Report - ${report.termName}`,
		description: `Complete registration report for ${report.termName}`,
		sections: [
			{
				properties: {
					page: {
						size: {
							orientation: PageOrientation.LANDSCAPE,
						},
						margin: {
							top: 720,
							right: 1440,
							bottom: 720,
							left: 1440,
						},
					},
				},
				footers: {
					default: new Footer({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: `Generated: ${report.generatedAt.toLocaleDateString(
											'en-LS',
											{
												year: 'numeric',
												month: 'long',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											}
										)}`,
										font: 'Arial',
										size: 16,
										color: '333333',
									}),
								],
								alignment: AlignmentType.CENTER,
							}),
						],
					}),
				},
				children: [
					...headerParagraphs,
					createFullReportInfoTable(report),
					new Paragraph({
						children: [
							new TextRun({
								text: 'Registered Students',
								font: 'Arial',
								bold: true,
								size: 24,
								color: '000000',
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { after: 240, before: 360 },
						pageBreakBefore: true,
					}),
					createFullStudentsTable(report.students),
				],
			},
		],
	});

	return doc;
}

export function createSummaryRegistrationDocument(
	report: SummaryRegistrationReport
): Document {
	const logoImage = getLogoImage();

	const headerParagraphs: Paragraph[] = [];

	if (logoImage.length > 0) {
		headerParagraphs.push(
			new Paragraph({
				children: [
					new ImageRun({
						data: logoImage,
						transformation: {
							width: 360,
							height: 180,
						},
						type: 'jpg',
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 400 },
			})
		);
	}

	headerParagraphs.push(
		new Paragraph({
			children: [
				new TextRun({
					text: 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY',
					font: 'Arial',
					bold: true,
					size: 28,
					color: '000000',
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 200 },
		}),
		new Paragraph({
			children: [
				new TextRun({
					text: 'REGISTRY DEPARTMENT',
					font: 'Arial',
					bold: true,
					size: 22,
					color: '333333',
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 300 },
		})
	);

	const doc = new Document({
		creator: 'Limkokwing University Registry System',
		title: `Summary Registration Report - ${report.termName}`,
		description: `Summary registration report for ${report.termName}`,
		sections: [
			{
				properties: {
					page: {
						size: {
							orientation: PageOrientation.LANDSCAPE,
						},
						margin: {
							top: 720,
							right: 1440,
							bottom: 720,
							left: 1440,
						},
					},
				},
				footers: {
					default: new Footer({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: `Generated: ${report.generatedAt.toLocaleDateString(
											'en-LS',
											{
												year: 'numeric',
												month: 'long',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											}
										)}`,
										font: 'Arial',
										size: 16,
										color: '333333',
									}),
								],
								alignment: AlignmentType.CENTER,
							}),
						],
					}),
				},
				children: [
					...headerParagraphs,
					createSummaryReportInfoTable(report),
					new Paragraph({
						text: '',
						spacing: { after: 360 },
					}),
					...report.schools.flatMap((school, schoolIndex) => [
						new Paragraph({
							children: [
								new TextRun({
									text: `${school.schoolName}`,
									font: 'Arial',
									bold: true,
									size: 20,
									color: '000000',
								}),
							],
							spacing: {
								after: 120,
								before: schoolIndex === 0 ? 240 : 360,
							},
						}),
						new Paragraph({
							children: [
								new TextRun({
									text: `Total Students: ${school.totalStudents}`,
									font: 'Arial',
									size: 16,
									color: '333333',
								}),
							],
							spacing: { after: 240 },
						}),
						createSummaryTable(school.programs, school.totalStudents),
					]),
				],
			},
		],
	});

	return doc;
}

function createFullReportInfoTable(report: FullRegistrationReport): Table {
	return new Table({
		rows: [
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Term',
										font: 'Arial',
										bold: true,
										size: 18,
										color: 'FFFFFF',
									}),
								],
								spacing: { before: 80, after: 80 },
							}),
						],
						width: { size: 35, type: WidthType.PERCENTAGE },
						shading: { fill: '000000' },
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: report.termName,
										font: 'Arial',
										bold: true,
										size: 18,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 80, after: 80 },
							}),
						],
						width: { size: 65, type: WidthType.PERCENTAGE },
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
						shading: { fill: 'F8F8F8' },
					}),
				],
			}),
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Total Registered Students',
										font: 'Arial',
										bold: true,
										size: 18,
										color: 'FFFFFF',
									}),
								],
								spacing: { before: 80, after: 80 },
							}),
						],
						shading: { fill: '000000' },
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: report.totalStudents.toLocaleString(),
										font: 'Arial',
										bold: true,
										size: 20,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 80, after: 80 },
							}),
						],
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
						shading: { fill: 'F8F8F8' },
					}),
				],
			}),
		],
		width: { size: 100, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			bottom: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			left: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			right: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '666666' },
			insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
		},
	});
}

function createSummaryReportInfoTable(
	report: SummaryRegistrationReport
): Table {
	return new Table({
		rows: [
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Term',
										font: 'Arial',
										bold: true,
										size: 18,
										color: 'FFFFFF',
									}),
								],
								spacing: { before: 80, after: 80 },
							}),
						],
						width: { size: 35, type: WidthType.PERCENTAGE },
						shading: { fill: '000000' },
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: report.termName,
										font: 'Arial',
										bold: true,
										size: 20,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 80, after: 80 },
							}),
						],
						width: { size: 65, type: WidthType.PERCENTAGE },
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
						shading: { fill: 'F8F8F8' },
					}),
				],
			}),
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Total Registered Students',
										font: 'Arial',
										bold: true,
										size: 18,
										color: 'FFFFFF',
									}),
								],
								spacing: { before: 80, after: 80 },
							}),
						],
						shading: { fill: '000000' },
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: report.totalStudents.toLocaleString(),
										font: 'Arial',
										bold: true,
										size: 20,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 80, after: 80 },
							}),
						],
						verticalAlign: 'center',
						margins: { top: 150, bottom: 150, left: 150, right: 150 },
						shading: { fill: 'F8F8F8' },
					}),
				],
			}),
		],
		width: { size: 100, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			bottom: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			left: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			right: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '666666' },
			insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
		},
	});
}

function createFullStudentsTable(
	students: Array<{
		stdNo: number;
		name: string;
		programName: string;
		semesterNumber: string;
		schoolName: string;
		status: string;
	}>
): Table {
	const headerRow = new TableRow({
		children: [
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'No',
								font: 'Arial',
								bold: true,
								size: 18,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 8, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Student No.',
								font: 'Arial',
								bold: true,
								size: 18,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 12, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Student Name',
								font: 'Arial',
								bold: true,
								size: 18,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 25, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Program',
								font: 'Arial',
								bold: true,
								size: 18,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 30, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Semester',
								font: 'Arial',
								bold: true,
								size: 18,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 10, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'School',
								font: 'Arial',
								bold: true,
								size: 18,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 15, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
		],
	});

	const dataRows = students.map((student, index) => {
		const isEvenRow = index % 2 === 0;
		return new TableRow({
			children: [
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: (index + 1).toString(),
									font: 'Arial',
									size: 16,
									color: '000000',
								}),
							],
							alignment: AlignmentType.CENTER,
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 100, bottom: 100, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: student.stdNo.toString(),
									font: 'Arial',
									size: 16,
									color: '000000',
								}),
							],
							alignment: AlignmentType.CENTER,
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 100, bottom: 100, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: student.name,
									font: 'Arial',
									size: 16,
									color: '000000',
								}),
							],
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 100, bottom: 100, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: student.programName,
									font: 'Arial',
									size: 16,
									color: '000000',
								}),
							],
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 100, bottom: 100, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: formatSemester(student.semesterNumber, 'short'),
									font: 'Arial',
									size: 16,
									color: '000000',
								}),
							],
							alignment: AlignmentType.CENTER,
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 100, bottom: 100, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: student.schoolName,
									font: 'Arial',
									size: 16,
									color: '000000',
								}),
							],
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 100, bottom: 100, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
			],
		});
	});

	return new Table({
		rows: [headerRow, ...dataRows],
		width: { size: 100, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
		},
	});
}

function createSummaryTable(
	programs: Array<{
		programName: string;
		yearBreakdown: { [year: number]: number };
		totalStudents: number;
	}>,
	schoolTotalStudents: number
): Table {
	if (programs.length === 0) {
		return new Table({
			rows: [
				new TableRow({
					children: [
						new TableCell({
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: 'No programs found',
											font: 'Arial',
											size: 16,
											color: '666666',
										}),
									],
									alignment: AlignmentType.CENTER,
								}),
							],
							margins: { top: 120, bottom: 120, left: 120, right: 120 },
						}),
					],
				}),
			],
			width: { size: 100, type: WidthType.PERCENTAGE },
		});
	}

	const allSemesters = new Set<string>();
	programs.forEach((program) => {
		Object.keys(program.yearBreakdown).forEach((semester) => {
			allSemesters.add(semester);
		});
	});
	const sortedSemesters = Array.from(allSemesters).sort(
		(a, b) => Number(a) - Number(b)
	);

	const headerRow = new TableRow({
		children: [
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Program',
								font: 'Arial',
								bold: true,
								size: 16,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 40, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			...sortedSemesters.map(
				(semester) =>
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: formatSemester(semester, 'short'),
										font: 'Arial',
										bold: true,
										size: 14,
										color: 'FFFFFF',
									}),
								],
								alignment: AlignmentType.CENTER,
							}),
						],
						width: {
							size: 45 / sortedSemesters.length,
							type: WidthType.PERCENTAGE,
						},
						shading: { fill: '000000' },
						margins: { top: 120, bottom: 120, left: 120, right: 120 },
						verticalAlign: 'center',
					})
			),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Total',
								font: 'Arial',
								bold: true,
								size: 16,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				width: { size: 15, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
		],
	});

	const dataRows = programs.map((program, index) => {
		const isEvenRow = index % 2 === 0;
		return new TableRow({
			children: [
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: program.programName,
									font: 'Arial',
									size: 14,
									color: '000000',
								}),
							],
						}),
					],
					shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
					margins: { top: 120, bottom: 120, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
				...sortedSemesters.map(
					(semester) =>
						new TableCell({
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: (
												program.yearBreakdown[
													semester as unknown as keyof typeof program.yearBreakdown
												] || 0
											).toString(),
											font: 'Arial',
											size: 14,
											color: '000000',
										}),
									],
									alignment: AlignmentType.CENTER,
								}),
							],
							shading: { fill: isEvenRow ? 'F8F8F8' : 'FFFFFF' },
							margins: { top: 120, bottom: 120, left: 120, right: 120 },
							verticalAlign: 'center',
						})
				),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: program.totalStudents.toString(),
									font: 'Arial',
									bold: true,
									size: 14,
									color: '000000',
								}),
							],
							alignment: AlignmentType.CENTER,
						}),
					],
					shading: { fill: isEvenRow ? 'F0F0F0' : 'E8E8E8' },
					margins: { top: 120, bottom: 120, left: 120, right: 120 },
					verticalAlign: 'center',
				}),
			],
		});
	});

	const semesterTotals: { [key: string]: number } = {};
	programs.forEach((program) => {
		Object.entries(program.yearBreakdown).forEach(([semester, count]) => {
			semesterTotals[semester] = (semesterTotals[semester] || 0) + count;
		});
	});

	const totalsRow = new TableRow({
		children: [
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Total Students',
								font: 'Arial',
								bold: true,
								size: 16,
								color: '000000',
							}),
						],
					}),
				],
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			...sortedSemesters.map(
				(semester) =>
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: (semesterTotals[semester] || 0).toString(),
										font: 'Arial',
										bold: true,
										size: 16,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
							}),
						],
						margins: { top: 120, bottom: 120, left: 120, right: 120 },
						verticalAlign: 'center',
					})
			),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: schoolTotalStudents.toString(),
								font: 'Arial',
								bold: true,
								size: 16,
								color: '000000',
							}),
						],
						alignment: AlignmentType.CENTER,
					}),
				],
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
		],
	});

	return new Table({
		rows: [headerRow, ...dataRows, totalsRow],
		width: { size: 100, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
		},
	});
}
