import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
} from 'docx';
import { CourseSummaryReport } from './repository';

export function createCourseSummaryDocument(
  report: CourseSummaryReport,
): Document {
  const doc = new Document({
    creator: 'Limkokwing University Registry System',
    title: `Course Summary Report - ${report.courseCode}`,
    description: `Course summary report for ${report.courseName}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'LIMKOKWING UNIVERSITY OF CREATIVE TECHNOLOGY',
                    bold: true,
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'LESOTHO',
                    bold: true,
                    size: 14,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date Generated: ${new Date().toLocaleDateString(
                      'en-LS',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}`,
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
              new TextRun({
                text: 'BOARD OF EXAMINATION',
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
                text: 'COURSE SUMMARY REPORT',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),
          createInfoTable(report),
          new Paragraph({
            text: '',
            spacing: { after: 240 },
          }),
          createStatisticsTable(report),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Names of Students Failed',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            pageBreakBefore: true,
          }),
          ...(report.failedStudents.length > 0 ||
          report.supplementaryStudents.length > 0
            ? [
                createFailedStudentsTable([
                  ...report.failedStudents,
                  ...report.supplementaryStudents,
                ]),
              ]
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'No Students Failed',
                      bold: true,
                      size: 24,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 240 },
                }),
              ]),
          new Paragraph({
            text: '',
            spacing: { after: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Summary by Lecturer',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: report.principalLecturer,
                size: 18,
              }),
            ],
            spacing: { after: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${report.date}`,
                bold: true,
                size: 18,
              }),
            ],
          }),
        ],
      },
    ],
  });
  return doc;
}

function createInfoTable(report: CourseSummaryReport): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Principal Lecturer',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.principalLecturer,
                    size: 20,
                  }),
                ],
              }),
            ],
            width: { size: 75, type: WidthType.PERCENTAGE },
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
                    text: 'Course Name',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.courseName,
                    size: 20,
                  }),
                ],
              }),
            ],
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
                    text: 'Program',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.programName,
                    size: 20,
                  }),
                ],
              }),
            ],
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
                    text: 'Course Code',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.courseCode,
                    size: 20,
                  }),
                ],
              }),
            ],
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
                    text: 'Date',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.date,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
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

function createStatisticsTable(report: CourseSummaryReport): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Number of Students',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            width: { size: 75, type: WidthType.PERCENTAGE },
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalStudents.toString(),
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 25, type: WidthType.PERCENTAGE },
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
                    text: 'Number of Passes',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalPasses.toString(),
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
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
                    text: 'Number of Failures',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalFailures.toString(),
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
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
                    text: '(to repeat module)',
                    italics: true,
                    size: 16,
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })],
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
                    text: 'Number of Supplementary',
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
            shading: { fill: '000000' },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalSupplementary.toString(),
                    size: 20,
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

function createFailedStudentsTable(
  failedStudents: Array<{
    studentName: string;
    studentNumber: string;
    marks: string;
    reason: string;
    actionTaken: string;
  }>,
): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'No',
                bold: true,
                size: 18,
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
                text: 'Student Name',
                bold: true,
                size: 18,
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
                text: 'Class',
                bold: true,
                size: 18,
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
                text: 'Mark (100)',
                bold: true,
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Reason',
                bold: true,
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Action Taken',
                bold: true,
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: 'E0E0E0' },
      }),
    ],
  });

  const dataRows = failedStudents.map((student, index) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: (index + 1).toString(),
                  size: 16,
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
                  text: student.studentName,
                  size: 16,
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
                  text: student.studentNumber,
                  size: 16,
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
                  text: student.marks,
                  size: 16,
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
                  text: student.reason,
                  size: 16,
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
                  text: student.actionTaken,
                  size: 16,
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
