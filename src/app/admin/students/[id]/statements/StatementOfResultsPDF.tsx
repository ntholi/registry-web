import { formatDate } from '@/lib/utils';
import { getStudent } from '@/server/students/actions';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from '@react-pdf/renderer';
import { calculateAcademicRemarks } from './academicRemarks';

interface Module {
  id: number;
  code: string;
  name: string;
}

interface SemesterModule {
  credits: number;
  module?: Module | null;
}

interface StudentModule {
  id: number;
  semesterModuleId: number;
  semesterModule: SemesterModule;
  grade: string;
  status: ModuleStatus;
  marks: string;
  createdAt: Date | null;
}

interface Semester {
  id: number;
  term: string;
  status: string;
  semesterNumber?: number | null;
  studentProgramId: number;
  cafDate: string | null;
  createdAt: Date | null;
  studentModules?: StudentModule[];
}

interface Program {
  id: number;
  status: string;
  structure: {
    program: {
      name: string;
    };
  };
  semesters?: Semester[];
}

type StatementOfResultsPDFProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  printRecordId?: string;
  qrCodeDataURL?: string;
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
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf',
      fontWeight: 'normal',
      fontStyle: 'italic',
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
  logo: {
    height: 90,
    alignSelf: 'center',
    marginBottom: 10,
  },
  universityHeader: {
    textAlign: 'center',
    marginBottom: 20,
  },
  universityAddress: {
    fontSize: 9,
    color: '#666',
    marginTop: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 1,
    color: '#000',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  academicRemarksColumn: {
    flex: 1,
    paddingLeft: 20,
  },
  academicRemarksSection: {
    marginBottom: 12,
  },
  academicRemarksLabel: {
    fontSize: 10,
    marginBottom: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  academicRemarksValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  academicRemarksDetails: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pendingModulesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #e0e0e0',
  },
  pendingModulesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  pendingModuleItem: {
    fontSize: 8,
    marginBottom: 2,
    color: '#000',
    paddingLeft: 4,
  },
  failedModule: {
    color: '#000',
  },
  supplementaryModule: {
    color: '#666',
  },
  remarksDetails: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  signatureAndQrContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 50,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 3,
  },
  signatureSection: {
    alignItems: 'center',
    width: 200,
  },
  signatureImage: {
    width: 120,
    height: 60,
  },
  signatureLine: {
    borderBottom: '1px solid #333',
    width: 150,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  qrCodeSection: {
    alignItems: 'center',
    width: 120,
  },
  qrCodeImage: {
    width: 80,
    height: 80,
    marginBottom: 3,
  },
  qrCodeLabel: {
    fontSize: 7,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  registrarInfo: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  officialText: {
    flex: 1,
    paddingRight: 20,
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

import {
  isFailingGrade,
  getGradePoints,
  summarizeModules,
  ModuleSummaryInput,
} from '@/utils/grades';
import { ModuleStatus } from '@/db/schema';

function getGradeStyle(grade: string) {
  if (isFailingGrade(grade)) return 'failedGrade';
  if (['A+', 'A', 'A-'].includes(grade)) return 'outstandingGrade';
  return 'passedGrade';
}

function calculateSemesterGPA(studentModules: StudentModule[]) {
  if (!studentModules || studentModules.length === 0)
    return { gpa: 0, totalCredits: 0, qualityPoints: 0 };

  try {
    const modules: ModuleSummaryInput[] = studentModules
      .filter((sm) => sm && sm.semesterModule && sm.grade != null)
      .map((sm) => ({
        grade: sm.grade || 'NM',
        credits: Math.max(0, sm.semesterModule?.credits || 0),
        status: sm.status,
      }));

    if (modules.length === 0) {
      return { gpa: 0, totalCredits: 0, qualityPoints: 0 };
    }

    const summary = summarizeModules(modules);

    return {
      gpa: Math.round((summary.gpa || 0) * 100) / 100,
      totalCredits: summary.creditsCompleted || 0,
      qualityPoints: summary.points || 0,
    };
  } catch (error) {
    console.error('Error calculating semester GPA:', error);
    return { gpa: 0, totalCredits: 0, qualityPoints: 0 };
  }
}

function calculateCumulativeGPA(programs: Program[]) {
  try {
    const allModules: ModuleSummaryInput[] = [];

    if (!programs || programs.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        qualityPoints: 0,
      };
    }

    programs.forEach((program) => {
      if (!program || !program.semesters) return;

      program.semesters.forEach((semester: Semester) => {
        if (!semester || !semester.studentModules) return;

        semester.studentModules.forEach((sm: StudentModule) => {
          if (!sm || !sm.semesterModule || sm.grade == null) return;

          allModules.push({
            grade: sm.grade || 'NM',
            credits: Math.max(0, sm.semesterModule?.credits || 0),
            status: sm.status,
          });
        });
      });
    });

    if (allModules.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        totalCreditsAttempted: 0,
        qualityPoints: 0,
      };
    }

    const summary = summarizeModules(allModules);

    return {
      gpa: Math.round((summary.gpa || 0) * 100) / 100,
      totalCredits: summary.creditsCompleted || 0,
      totalCreditsAttempted: summary.creditsAttempted || 0,
      qualityPoints: summary.points || 0,
    };
  } catch (error) {
    console.error('Error calculating cumulative GPA:', error);
    return {
      gpa: 0,
      totalCredits: 0,
      totalCreditsAttempted: 0,
      qualityPoints: 0,
    };
  }
}

export default function StatementOfResultsPDF({
  student,
  printRecordId,
  qrCodeDataURL,
}: StatementOfResultsPDFProps) {
  try {
    if (!student || !student.programs) {
      return (
        <Document>
          <Page size='A4' style={styles.page}>
            <Text>No student data available</Text>
          </Page>
        </Document>
      );
    }

    const activePrograms = (student.programs || []).filter(
      (program) => program && program.status === 'Active',
    );

    const filteredPrograms = activePrograms.map((program) => ({
      ...program,
      semesters: (program.semesters || [])
        .filter(
          (semester) =>
            semester && !['Deleted', 'Deferred'].includes(semester.status),
        )
        .map((semester) => ({
          ...semester,
          studentModules: (semester.studentModules || []).filter(
            (module) => module && !['Delete', 'Drop'].includes(module.status),
          ),
        })),
    }));

    const cumulativeStats = calculateCumulativeGPA(filteredPrograms);
    const academicRemarks = calculateAcademicRemarks(student.programs);

    return (
      <Document>
        <Page size='A4' style={styles.page}>
          <View style={styles.header}>
            <Image style={styles.logo} src='/images/logo-lesotho.jpg' />
            <Text style={styles.title}>STATEMENT OF RESULTS</Text>
            <Text style={styles.universityAddress}>
              This document does not certify graduation
            </Text>
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
          </View>
          {filteredPrograms.map((program) => (
            <View key={program.id} style={styles.programSection}>
              <Text style={styles.programTitle}>
                {program.structure.program.name}
              </Text>
              {(program.semesters || []).map((semester) => {
                const semesterStats = calculateSemesterGPA(
                  semester.studentModules || [],
                );

                return (
                  <View key={semester.id} style={styles.semesterSection}>
                    <View style={styles.semesterTitle} wrap={false}>
                      <Text>{semester.term}</Text>
                      <Text>GPA: {(semesterStats.gpa || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.table}>
                      <View
                        style={[styles.tableRow, styles.tableHeader]}
                        wrap={false}
                      >
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
                      {(semester.studentModules || []).map((sm) => (
                        <View
                          key={sm.semesterModuleId}
                          style={styles.tableRow}
                          wrap={false}
                        >
                          <Text
                            style={[
                              styles.tableCell,
                              styles.codeCell,
                              styles.moduleText,
                            ]}
                          >
                            {sm.semesterModule?.module?.code ??
                              `${sm.semesterModuleId}`}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.nameCell,
                              styles.moduleText,
                            ]}
                          >
                            {sm.semesterModule?.module?.name ??
                              `<<Semester Module ID: ${sm.semesterModuleId}>>`}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.creditsCell,
                              styles.moduleText,
                            ]}
                          >
                            {sm.semesterModule?.credits || 0}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.gradeCell,
                              styles.moduleText,
                              styles[getGradeStyle(sm.grade || 'NM')],
                            ]}
                          >
                            {sm.grade || 'NM'}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.pointsCell,
                              styles.moduleText,
                            ]}
                          >
                            {getGradePoints(sm.grade || 'NM').toFixed(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          <View wrap={false}>
            <View style={styles.cumulativeSummary}>
              <Text style={styles.cumulativeTitle}>
                CUMULATIVE ACADEMIC SUMMARY
              </Text>
              <View style={styles.cumulativeGrid}>
                <View style={styles.cumulativeColumn}>
                  <View style={styles.cumulativeItem}>
                    <Text style={styles.cumulativeLabel}>
                      Credits Attempted
                    </Text>
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
                      {(cumulativeStats.gpa || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.academicRemarksColumn}>
                  <View style={styles.academicRemarksSection}>
                    <Text style={styles.academicRemarksLabel}>
                      Academic Status
                    </Text>
                    <Text style={styles.academicRemarksValue}>
                      {academicRemarks.status}
                    </Text>
                    <Text style={styles.academicRemarksDetails}>
                      {academicRemarks.details}
                    </Text>
                  </View>
                  {academicRemarks.pendingModules.length > 0 && (
                    <View style={styles.pendingModulesSection}>
                      <Text style={styles.pendingModulesTitle}>
                        Outstanding Requirements (
                        {academicRemarks.pendingModules.length})
                      </Text>
                      {academicRemarks.pendingModules.map((module, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.pendingModuleItem,
                            module.type === 'Failed'
                              ? styles.failedModule
                              : styles.supplementaryModule,
                          ]}
                        >
                          • {module.code} - {module.name}
                          {module.type === 'Supplementary'
                            ? ' (Supplementary)'
                            : ' (Repeat)'}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureSection}>
                <Image
                  style={styles.signatureImage}
                  src='/images/signature_small.png'
                />
                <Text style={styles.signatureLine}></Text>
                <Text style={styles.signatureLabel}>Registrar</Text>
              </View>
              {qrCodeDataURL && (
                <View style={styles.qrCodeSection}>
                  <Image style={styles.qrCodeImage} src={qrCodeDataURL} />
                  <Text style={styles.qrCodeLabel}>
                    Scan to verify{'\n'}statement authenticity
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Page>
      </Document>
    );
  } catch (error) {
    console.error('Error generating Statement of Results PDF:', error);
    return (
      <Document>
        <Page size='A4' style={styles.page}>
          <Text>Error generating Statement of Results. Please try again.</Text>
        </Page>
      </Document>
    );
  }
}
