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
  ImageRun,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { CourseSummaryReport } from './repository';

export function createCourseSummaryDocument(
  report: CourseSummaryReport,
): Document {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'logo-lesotho.jpg',
  );
  const logoImage = fs.readFileSync(logoPath);

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
                    text: `Date Created: ${new Date().toLocaleDateString(
                      'en-LS',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
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
                text: 'BOARD OF EXAMINATION',
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
                text: 'COURSE SUMMARY REPORT',
                font: 'Tahoma',
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),
          createCombinedInfoTable(report),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Names of Students Failed',
                font: 'Tahoma',
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
                      font: 'Tahoma',
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
                font: 'Tahoma',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: report.lecturer,
                font: 'Tahoma',
                size: 18,
              }),
            ],
            spacing: { after: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${report.date}`,
                font: 'Tahoma',
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

function createCombinedInfoTable(report: CourseSummaryReport): Table {
  return new Table({
    rows: [
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Principal Lecturer',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.lecturer,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 80, after: 80 },
              }),
            ],
            width: { size: 70, type: WidthType.PERCENTAGE },
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Course Name',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.courseName,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Program',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.programName,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Course Code',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.courseCode,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Date',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.date,
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 300, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                text: '',
                spacing: { before: 0, after: 0 },
              }),
            ],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
              right: { style: BorderStyle.NONE },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: '',
                spacing: { before: 0, after: 0 },
              }),
            ],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Number of Students',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Number of Passes',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalPasses.toString(),
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 600, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Number of Failures',
                    font: 'Tahoma',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 30, after: 0 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: '(to repeat module)',
                    font: 'Tahoma',
                    italics: true,
                    size: 16,
                    color: 'FFFFFF',
                  }),
                ],
                spacing: { before: 0, after: 30 },
              }),
            ],
            shading: { fill: '000000' },
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalFailures.toString(),
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
          }),
        ],
      }),
      new TableRow({
        height: { value: 900, rule: 'exact' },
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Number of Supplementary',
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
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
              right: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: report.totalSupplementary.toString(),
                    font: 'Tahoma',
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
              }),
            ],
            verticalAlign: 'center',
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
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
                font: 'Tahoma',
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
                font: 'Tahoma',
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
                text: 'Student No.',
                font: 'Tahoma',
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
                font: 'Tahoma',
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
                font: 'Tahoma',
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
                font: 'Tahoma',
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
                  font: 'Tahoma',
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
                  font: 'Tahoma',
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
                  font: 'Tahoma',
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
                  font: 'Tahoma',
                  size: 16,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
        new TableCell({
          children: student.reason.split('\n').map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    font: 'Tahoma',
                    size: 16,
                  }),
                ],
              }),
          ),
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: student.actionTaken,
                  font: 'Tahoma',
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
