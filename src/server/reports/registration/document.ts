import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Footer,
  ImageRun,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import {
  FullRegistrationReport,
  SummaryRegistrationReport,
} from './repository';

export function createFullRegistrationDocument(
  report: FullRegistrationReport
): Document {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'logo-lesotho.jpg'
  );
  const logoImage = fs.readFileSync(logoPath);

  const doc = new Document({
    creator: 'Limkokwing University Registry System',
    title: `Full Registration Report - ${report.termName}`,
    description: `Complete registration report for ${report.termName}`,
    sections: [
      {
        properties: {
          page: {
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
                    font: 'Tahoma',
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: logoImage,
                transformation: {
                  width: 300,
                  height: 150,
                },
                type: 'jpg',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'REGISTRY DEPARTMENT',
                font: 'Tahoma',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'FULL REGISTRATION REPORT',
                font: 'Tahoma',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),
          createFullReportInfoTable(report),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Registered Students',
                font: 'Tahoma',
                bold: true,
                size: 24,
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
  const logoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'logo-lesotho.jpg'
  );
  const logoImage = fs.readFileSync(logoPath);

  const doc = new Document({
    creator: 'Limkokwing University Registry System',
    title: `Summary Registration Report - ${report.termName}`,
    description: `Summary registration report for ${report.termName}`,
    sections: [
      {
        properties: {
          page: {
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
                    font: 'Tahoma',
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: logoImage,
                transformation: {
                  width: 300,
                  height: 150,
                },
                type: 'jpg',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'REGISTRY DEPARTMENT',
                font: 'Tahoma',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'SUMMARY REGISTRATION REPORT',
                font: 'Tahoma',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),
          createSummaryReportInfoTable(report),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Registration Summary by School and Program',
                font: 'Tahoma',
                bold: true,
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240, before: 360 },
            pageBreakBefore: true,
          }),
          ...report.schools.flatMap((school) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${school.schoolName} (Total: ${school.totalStudents} students)`,
                  font: 'Tahoma',
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { after: 180, before: 240 },
            }),
            createSummaryTable(school.programs),
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
                    font: 'Tahoma',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: '000000' },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.termName,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            width: { size: 70, type: WidthType.PERCENTAGE },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
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
                    font: 'Tahoma',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            shading: { fill: '000000' },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalStudents.toString(),
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
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
                    font: 'Tahoma',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: '000000' },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.termName,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            width: { size: 70, type: WidthType.PERCENTAGE },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
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
                    font: 'Tahoma',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            shading: { fill: '000000' },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalStudents.toString(),
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
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
                    text: 'Total Schools',
                    font: 'Tahoma',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            shading: { fill: '000000' },
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.schools.length.toString(),
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    },
  });
}

function createFullStudentsTable(
  students: Array<{
    stdNo: number;
    name: string;
    programName: string;
    semesterNumber: number;
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
                font: 'Tahoma',
                bold: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Student No.',
                font: 'Tahoma',
                bold: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Student Name',
                font: 'Tahoma',
                bold: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Program',
                font: 'Tahoma',
                bold: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Semester',
                font: 'Tahoma',
                bold: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'School',
                font: 'Tahoma',
                bold: true,
                size: 16,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
    ],
  });

  const dataRows = students.map((student, index) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: (index + 1).toString(),
                  font: 'Tahoma',
                  size: 14,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: student.stdNo.toString(),
                  font: 'Tahoma',
                  size: 14,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: student.name,
                  font: 'Tahoma',
                  size: 14,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: student.programName,
                  font: 'Tahoma',
                  size: 14,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: student.semesterNumber.toString(),
                  font: 'Tahoma',
                  size: 14,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: student.schoolName,
                  font: 'Tahoma',
                  size: 14,
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

function createSummaryTable(
  programs: Array<{
    programName: string;
    yearBreakdown: { [year: number]: number };
    totalStudents: number;
  }>
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
                      font: 'Tahoma',
                      size: 14,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  const allYears = new Set<number>();
  programs.forEach((program) => {
    Object.keys(program.yearBreakdown).forEach((year) => {
      allYears.add(parseInt(year));
    });
  });
  const sortedYears = Array.from(allYears).sort();

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Program',
                font: 'Tahoma',
                bold: true,
                size: 14,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      ...sortedYears.map(
        (year) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Year ${year}`,
                    font: 'Tahoma',
                    bold: true,
                    size: 14,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: {
              size: 60 / sortedYears.length,
              type: WidthType.PERCENTAGE,
            },
            shading: { fill: 'E0E0E0' },
          })
      ),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Total',
                font: 'Tahoma',
                bold: true,
                size: 14,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
    ],
  });

  const dataRows = programs.map((program) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: program.programName,
                  font: 'Tahoma',
                  size: 12,
                }),
              ],
            }),
          ],
        }),
        ...sortedYears.map(
          (year) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (program.yearBreakdown[year] || 0).toString(),
                      font: 'Tahoma',
                      size: 12,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            })
        ),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: program.totalStudents.toString(),
                  font: 'Tahoma',
                  bold: true,
                  size: 12,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}
