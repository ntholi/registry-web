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
import type { GraduationSummaryReport } from '../_lib/types';

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

export function createGraduationSummaryDocument(
	report: GraduationSummaryReport
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
					text: 'GRADUATION REPORT',
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
		title: `Graduation Report - ${report.graduationDate}`,
		description: `Graduation summary report for ${report.graduationDate}`,
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
					createSummaryInfoTable(report),
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
									text: `Total Graduates: ${school.totalGraduates} (Male: ${school.maleCount}, Female: ${school.femaleCount})`,
									font: 'Arial',
									size: 16,
									color: '333333',
								}),
							],
							spacing: { after: 240 },
						}),
						createSchoolTable(school),
					]),
				],
			},
		],
	});

	return doc;
}

function createSummaryInfoTable(report: GraduationSummaryReport): Table {
	const rows: TableRow[] = [
		new TableRow({
			children: [
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: 'Graduation Date',
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
									text: report.graduationDate,
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
					shading: { fill: '000000' },
					verticalAlign: 'center',
					margins: { top: 150, bottom: 150, left: 150, right: 150 },
				}),
				new TableCell({
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: report.totalGraduates.toLocaleString(),
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
									text: 'Gender Distribution',
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
									text: `Male: ${report.maleCount} | Female: ${report.femaleCount}`,
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
		}),
	];

	if (report.averageAge !== null) {
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
										text: `${report.averageAge} years`,
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

	if (report.averageTimeToGraduate !== null) {
		rows.push(
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: 'Avg. Time to Graduate',
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
										text: `${report.averageTimeToGraduate} years`,
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
			top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
		},
	});
}

function createSchoolTable(
	school: GraduationSummaryReport['schools'][0]
): Table {
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
						spacing: { before: 60, after: 60 },
					}),
				],
				shading: { fill: '000000' },
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Male',
								font: 'Arial',
								bold: true,
								size: 16,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { before: 60, after: 60 },
					}),
				],
				shading: { fill: '000000' },
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				width: { size: 12, type: WidthType.PERCENTAGE },
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'Female',
								font: 'Arial',
								bold: true,
								size: 16,
								color: 'FFFFFF',
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { before: 60, after: 60 },
					}),
				],
				shading: { fill: '000000' },
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				width: { size: 12, type: WidthType.PERCENTAGE },
			}),
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
						spacing: { before: 60, after: 60 },
					}),
				],
				shading: { fill: '000000' },
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				width: { size: 12, type: WidthType.PERCENTAGE },
			}),
		],
	});

	const programRows = school.programs.map(
		(program, index) =>
			new TableRow({
				children: [
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: program.programName,
										font: 'Arial',
										size: 16,
										color: '000000',
									}),
								],
								spacing: { before: 60, after: 60 },
							}),
						],
						verticalAlign: 'center',
						margins: { top: 80, bottom: 80, left: 100, right: 100 },
						shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'F8F8F8' },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: program.maleCount.toString(),
										font: 'Arial',
										size: 16,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 60, after: 60 },
							}),
						],
						verticalAlign: 'center',
						margins: { top: 80, bottom: 80, left: 100, right: 100 },
						shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'F8F8F8' },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: program.femaleCount.toString(),
										font: 'Arial',
										size: 16,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 60, after: 60 },
							}),
						],
						verticalAlign: 'center',
						margins: { top: 80, bottom: 80, left: 100, right: 100 },
						shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'F8F8F8' },
					}),
					new TableCell({
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: program.totalGraduates.toString(),
										font: 'Arial',
										bold: true,
										size: 16,
										color: '000000',
									}),
								],
								alignment: AlignmentType.CENTER,
								spacing: { before: 60, after: 60 },
							}),
						],
						verticalAlign: 'center',
						margins: { top: 80, bottom: 80, left: 100, right: 100 },
						shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'F8F8F8' },
					}),
				],
			})
	);

	const totalRow = new TableRow({
		children: [
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: 'School Total',
								font: 'Arial',
								bold: true,
								size: 16,
								color: '000000',
							}),
						],
						alignment: AlignmentType.RIGHT,
						spacing: { before: 60, after: 60 },
					}),
				],
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				shading: { fill: 'E8E8E8' },
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: school.maleCount.toString(),
								font: 'Arial',
								bold: true,
								size: 16,
								color: '000000',
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { before: 60, after: 60 },
					}),
				],
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				shading: { fill: 'E8E8E8' },
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: school.femaleCount.toString(),
								font: 'Arial',
								bold: true,
								size: 16,
								color: '000000',
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { before: 60, after: 60 },
					}),
				],
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				shading: { fill: 'E8E8E8' },
			}),
			new TableCell({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: school.totalGraduates.toString(),
								font: 'Arial',
								bold: true,
								size: 16,
								color: '000000',
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { before: 60, after: 60 },
					}),
				],
				verticalAlign: 'center',
				margins: { top: 100, bottom: 100, left: 100, right: 100 },
				shading: { fill: 'E8E8E8' },
			}),
		],
	});

	return new Table({
		rows: [headerRow, ...programRows, totalRow],
		width: { size: 100, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
			insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
			insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
		},
	});
}
