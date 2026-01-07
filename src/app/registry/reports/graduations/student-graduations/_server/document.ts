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

export function createGraduationSummaryDocument(reportData: {
	totalGraduates: number;
	schools: Array<{
		schoolName: string;
		schoolCode: string;
		totalGraduates: number;
		programs: Array<{
			programName: string;
			totalGraduates: number;
		}>;
	}>;
	stats: {
		totalGraduates: number;
		byGender: Array<{ gender: string; count: number }>;
		byLevel: Array<{ level: string; count: number }>;
		averageAge: number | null;
		averageTimeToGraduate: number | null;
	};
	generatedAt: Date;
}): Document {
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
					text: 'GRADUATION SUMMARY REPORT',
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
		title: 'Graduation Summary Report',
		description: 'Summary graduation report',
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
										text: `Generated: ${reportData.generatedAt.toLocaleDateString(
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
					createSummaryInfoTable(reportData),
					new Paragraph({
						text: '',
						spacing: { after: 360 },
					}),
					...reportData.schools.flatMap((school, schoolIndex) => [
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
									text: `Total Graduates: ${school.totalGraduates}`,
									font: 'Arial',
									size: 16,
									color: '333333',
								}),
							],
							spacing: { after: 240 },
						}),
						createSchoolProgramsTable(school.programs, school.totalGraduates),
					]),
				],
			},
		],
	});

	return doc;
}

function createSummaryInfoTable(reportData: {
	totalGraduates: number;
	stats: {
		totalGraduates: number;
		byGender: Array<{ gender: string; count: number }>;
		byLevel: Array<{ level: string; count: number }>;
		averageAge: number | null;
		averageTimeToGraduate: number | null;
	};
}): Table {
	const rows: TableRow[] = [
		new TableRow({
			children: [
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: 'Total Graduates',
									font: 'Arial',
									bold: true,
									size: 18,
									color: 'FFFFFF',
								}),
							],
							spacing: { before: 80, after: 80 },
						}),
					],
					width: { size: 40, type: WidthType.PERCENTAGE },
					shading: { fill: '000000' },
					verticalAlign: 'center',
					margins: { top: 150, bottom: 150, left: 150, right: 150 },
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: reportData.totalGraduates.toLocaleString(),
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
					width: { size: 60, type: WidthType.PERCENTAGE },
					verticalAlign: 'center',
					margins: { top: 150, bottom: 150, left: 150, right: 150 },
					shading: { fill: 'F8F8F8' },
				}),
			],
		}),
	];

	if (reportData.stats.averageAge !== null) {
		rows.push(
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Average Age',
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
										text: `${reportData.stats.averageAge} years`,
										font: 'Arial',
										size: 18,
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
			})
		);
	}

	if (reportData.stats.averageTimeToGraduate !== null) {
		rows.push(
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Average Time to Graduate',
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
										text: `${reportData.stats.averageTimeToGraduate} months`,
										font: 'Arial',
										size: 18,
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
			})
		);
	}

	return new Table({
		rows,
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

function createSchoolProgramsTable(
	programs: Array<{
		programName: string;
		totalGraduates: number;
	}>,
	schoolTotalGraduates: number
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
				width: { size: 70, type: WidthType.PERCENTAGE },
				shading: { fill: '000000' },
				margins: { top: 120, bottom: 120, left: 120, right: 120 },
				verticalAlign: 'center',
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Total Graduates',
								font: 'Arial',
								bold: true,
								size: 16,
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
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: program.totalGraduates.toString(),
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
				}),
			],
		});
	});

	const totalsRow = new TableRow({
		children: [
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Total Graduates',
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
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: schoolTotalGraduates.toString(),
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
