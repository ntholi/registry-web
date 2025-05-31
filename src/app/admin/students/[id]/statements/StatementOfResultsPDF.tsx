'use client';

import { formatDate } from '@/lib/utils';
import { getStudent } from '@/server/students/actions';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

type StatementOfResultsPDFProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #000',
    paddingBottom: 15,
  },
  universityHeader: {
    textAlign: 'center',
    marginBottom: 15,
  },
  universityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  universityAddress: {
    fontSize: 9,
    color: '#666',
    width: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    color: '#000',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 2,
  },
  studentInfo: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    border: '1px solid #ccc',
    borderRadius: 2,
  },
  studentInfoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    borderBottom: '1px solid #ccc',
    paddingBottom: 5,
  },
  studentDetail: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    width: 140,
    color: '#333',
  },
  value: {
    flex: 1,
    color: '#000',
  },
  programSection: {
    marginBottom: 15,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 2,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#000',
    color: '#fff',
    padding: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  semesterSection: {
    marginBottom: 10,
    padding: 10,
  },
  semesterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: 6,
    borderRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleText: {
    fontSize: 9,
    lineHeight: 1.2,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 5,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableCell: {
    padding: 4,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#ccc',
    textAlign: 'left',
  },
  codeCell: {
    width: '18%',
  },
  nameCell: {
    width: '52%',
  },
  creditsCell: {
    width: '12%',
    textAlign: 'center',
  },
  gradeCell: {
    width: '10%',
    textAlign: 'center',
  },
  pointsCell: {
    width: '8%',
    textAlign: 'center',
  },
  summarySection: {
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValue: {
    color: '#000',
  },
  cumulativeSummary: {
    marginTop: 20,
    border: '2px solid #000',
    padding: 15,
    borderRadius: 2,
  },
  cumulativeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#000',
    borderBottom: '1px solid #000',
    paddingBottom: 8,
  },
  cumulativeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cumulativeColumn: {
    flex: 1,
  },
  cumulativeItem: {
    marginBottom: 8,
  },
  cumulativeLabel: {
    fontSize: 10,
    marginBottom: 2,
    color: '#333',
  },
  cumulativeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  academicStandingColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
  },
  academicStandingLabel: {
    fontSize: 10,
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  academicStandingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    borderTop: '1px solid #ccc',
    paddingTop: 15,
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  failedGrade: {
    color: '#000',
    fontWeight: 'bold',
  },
  passedGrade: {
    color: '#333',
  },
  outstandingGrade: {
    color: '#000',
    fontWeight: 'bold',
  },
  warningText: {
    color: '#666',
    fontWeight: 'bold',
  },
  gradeScale: {
    marginTop: 15,
    fontSize: 8,
    color: '#666',
  },
});

function failed(grade: string) {
  return [
    'F',
    'X',
    'GNS',
    'ANN',
    'FIN',
    'FX',
    'DNC',
    'DNA',
    'PP',
    'DNS',
  ].includes(grade);
}

function getGradePoints(grade: string): number {
  const gradePoints: Record<string, number> = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    'D-': 0.7,
    F: 0.0,
    X: 0.0,
    GNS: 0.0,
    ANN: 0.0,
    FIN: 0.0,
    FX: 0.0,
    DNC: 0.0,
    DNA: 0.0,
    PP: 0.0,
    DNS: 0.0,
  };
  return gradePoints[grade] || 0.0;
}

function getGradeStyle(grade: string) {
  if (failed(grade)) return 'failedGrade';
  if (['A+', 'A', 'A-'].includes(grade)) return 'outstandingGrade';
  return 'passedGrade';
}

function calculateSemesterGPA(studentModules: any[]) {
  if (!studentModules || studentModules.length === 0)
    return { gpa: 0, totalCredits: 0, qualityPoints: 0 };

  let totalQualityPoints = 0;
  let totalCredits = 0;

  studentModules.forEach((sm) => {
    const credits = sm.semesterModule.credits || 0;
    const points = getGradePoints(sm.grade);
    totalQualityPoints += credits * points;
    totalCredits += credits;
  });

  const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    qualityPoints: totalQualityPoints,
  };
}

function calculateCumulativeGPA(programs: any[]) {
  let totalQualityPoints = 0;
  let totalCredits = 0;
  let totalCreditsAttempted = 0;

  programs.forEach((program) => {
    program.semesters?.forEach((semester: any) => {
      semester.studentModules?.forEach((sm: any) => {
        const credits = sm.semesterModule.credits || 0;
        const points = getGradePoints(sm.grade);
        totalQualityPoints += credits * points;
        totalCreditsAttempted += credits;
        if (!failed(sm.grade)) {
          totalCredits += credits;
        }
      });
    });
  });

  const gpa =
    totalCreditsAttempted > 0 ? totalQualityPoints / totalCreditsAttempted : 0;
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalCreditsAttempted,
    qualityPoints: totalQualityPoints,
  };
}

export default function StatementOfResultsPDF({
  student,
}: StatementOfResultsPDFProps) {
  const activePrograms = student.programs.filter(
    (program) => program.status === 'Active',
  );
  const cumulativeStats = calculateCumulativeGPA(activePrograms);

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <View style={styles.universityHeader}>
            <Text style={styles.universityName}>
              Limkokwing University of Creative Technology
            </Text>
            <Text style={styles.universityAddress}>
              Official academic record showing student&apos;s course grades and
              academic performance
            </Text>
            <Text style={styles.universityAddress}>
              This document does not certify graduation
            </Text>
          </View>
          <Text style={styles.title}>STATEMENT OF RESULTS</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentInfoTitle}>STUDENT INFORMATION</Text>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>Student Number:</Text>
            <Text style={styles.value}>{student.stdNo}</Text>
          </View>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{student.name}</Text>
          </View>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>ID/Passport:</Text>
            <Text style={styles.value}>{student.nationalId}</Text>
          </View>
          <View style={styles.studentDetail}>
            <Text style={styles.label}>Date of Issue:</Text>
            <Text style={styles.value}>{formatDate(new Date())}</Text>
          </View>
        </View>{' '}
        {activePrograms.map((program) => (
          <View key={program.id} style={styles.programSection}>
            <Text style={styles.programTitle}>
              {program.structure.program.name}
            </Text>

            {program.semesters?.map((semester) => {
              const semesterStats = calculateSemesterGPA(
                semester.studentModules || [],
              );

              return (
                <View key={semester.id} style={styles.semesterSection}>
                  <View style={styles.semesterTitle}>
                    <Text>{semester.term}</Text>
                    <Text>GPA: {semesterStats.gpa.toFixed(2)}</Text>
                  </View>

                  <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.codeCell,
                          styles.moduleText,
                        ]}
                      >
                        Code
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.nameCell,
                          styles.moduleText,
                        ]}
                      >
                        Module Name
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.creditsCell,
                          styles.moduleText,
                        ]}
                      >
                        Credits
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.gradeCell,
                          styles.moduleText,
                        ]}
                      >
                        Grade
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.pointsCell,
                          styles.moduleText,
                        ]}
                      >
                        Points
                      </Text>
                    </View>

                    {semester.studentModules?.map((sm) => (
                      <View key={sm.semesterModuleId} style={styles.tableRow}>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.codeCell,
                            styles.moduleText,
                          ]}
                        >
                          {sm.semesterModule.module?.code ??
                            `${sm.semesterModuleId}`}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.nameCell,
                            styles.moduleText,
                          ]}
                        >
                          {sm.semesterModule.module?.name ??
                            `<<Semester Module ID: ${sm.semesterModuleId}>>`}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.creditsCell,
                            styles.moduleText,
                          ]}
                        >
                          {sm.semesterModule.credits}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.gradeCell,
                            styles.moduleText,
                            styles[getGradeStyle(sm.grade)],
                          ]}
                        >
                          {sm.grade}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.pointsCell,
                            styles.moduleText,
                          ]}
                        >
                          {getGradePoints(sm.grade).toFixed(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <View style={styles.cumulativeSummary}>
          <Text style={styles.cumulativeTitle}>
            CUMULATIVE ACADEMIC SUMMARY
          </Text>
          <View style={styles.cumulativeGrid}>
            <View style={styles.cumulativeColumn}>
              <View style={styles.cumulativeItem}>
                <Text style={styles.cumulativeLabel}>Credits Attempted</Text>
                <Text style={styles.cumulativeValue}>
                  {cumulativeStats.totalCreditsAttempted}
                </Text>
              </View>
              <View style={styles.cumulativeItem}>
                <Text style={styles.cumulativeLabel}>Credits Earned</Text>
                <Text style={styles.cumulativeValue}>
                  {cumulativeStats.totalCredits}
                </Text>
              </View>
              <View style={styles.cumulativeItem}>
                <Text style={styles.cumulativeLabel}>Cumulative GPA</Text>
                <Text style={styles.cumulativeValue}>
                  {cumulativeStats.gpa.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.academicStandingColumn}>
              <Text style={styles.academicStandingLabel}>
                Academic Standing
              </Text>
              <Text style={styles.academicStandingValue}>
                {cumulativeStats.gpa >= 3.5
                  ? 'Excellent'
                  : cumulativeStats.gpa >= 3.0
                    ? 'Good Standing'
                    : cumulativeStats.gpa >= 2.0
                      ? 'Satisfactory'
                      : 'Warning'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.gradeScale}>
          Grade Scale: A+ (4.0), A (4.0), A- (3.7), B+ (3.3), B (3.0), B- (2.7),
          C+ (2.3), C (2.0), C- (1.7), D+ (1.3), D (1.0), D- (0.7), F (0.0)
        </Text>
        <View style={styles.footer}>
          <Text>
            This is an official statement of results from Limkokwing University
            of Creative Technology.
          </Text>
          <Text>
            Date Generated:{' '}
            {new Date().toLocaleDateString('en-LS', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
