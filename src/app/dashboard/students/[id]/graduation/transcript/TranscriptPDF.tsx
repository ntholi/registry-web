import { formatDate } from '@/lib/utils';
import { getAcademicHistory } from '@/server/students/actions';
import { getGradePoints } from '@/utils/grades';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
};

Font.register({
  family: 'Arial',
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
    padding: 30,
    fontFamily: 'Arial',
    fontSize: 8,
  },
  spacer: {
    height: 6,
  },
  headerTable: {
    borderTop: '1px solid black',
    borderBottom: '1px solid black',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  headerLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  headerColon: {
    width: 5,
  },
  headerValue: {
    width: 230,
  },
  headerLabelRight: {
    fontWeight: 'bold',
    width: 120,
  },
  headerValueRight: {
    width: 250,
  },
  moduleTableHeader: {
    flexDirection: 'row',
    borderTop: '1px solid black',
    borderBottom: '1px solid black',
    paddingVertical: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  moduleTableContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  leftColumn: {
    width: '50%',
    paddingRight: 5,
  },
  rightColumn: {
    width: '50%',
    paddingLeft: 5,
  },
  moduleCode: {
    width: 80,
    textAlign: 'left',
    paddingLeft: 2,
  },
  moduleName: {
    flex: 1,
    textAlign: 'left',
  },
  moduleCredit: {
    width: 35,
    textAlign: 'center',
  },
  moduleGrade: {
    width: 35,
    textAlign: 'center',
  },
  termContainer: {
    marginTop: 8,
  },
  firstTermContainer: {
    marginTop: 4,
  },
  termTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moduleRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    alignItems: 'center',
  },
  summaryLabel: {
    width: 90,
  },
  summaryColon: {
    width: 10,
    textAlign: 'center',
  },
  summaryValue: {
    width: 50,
  },
  summarySpacer: {
    flexGrow: 1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    alignItems: 'flex-start',
  },
  footerLabel: {
    width: 150,
  },
  footerColon: {
    width: 10,
    textAlign: 'center',
  },
  footerValue: {
    width: 100,
  },
  registrarSection: {
    marginTop: 10,
    borderTop: '1px solid black',
    paddingTop: 5,
    width: 150,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  registrarNote: {
    marginTop: 5,
    fontSize: 7,
    width: 200,
  },
});

type ModuleRow = {
  code: string;
  name: string;
  credit: number;
  grade: string;
};

type TermSummary = {
  gpa: number;
  cgpa: number;
  credits: number;
  cumulativeCredits: number;
};

export default function TranscriptPDF({ student }: Props) {
  // For transcripts, prioritize Completed programs, fallback to Active
  const programs = student.programs || [];
  const completedPrograms = programs.filter(
    (program) => program && program.status === 'Completed'
  );
  const activePrograms = programs.filter(
    (program) => program && program.status === 'Active'
  );

  const primaryProgram =
    completedPrograms[0] || activePrograms[0] || programs[0];
  const programName =
    primaryProgram?.structure?.program?.name || 'Unknown Program';
  const facultyName =
    primaryProgram?.structure?.program?.school?.name || 'Unknown Faculty';

  const admissionDate = primaryProgram?.intakeDate || ' - ';
  const completionDate = primaryProgram?.graduationDate || ' - ';
  const nationality = ' - ';

  const groupedModules: Record<string, ModuleRow[]> = {};
  const termSummaries: Record<string, TermSummary> = {};

  primaryProgram?.semesters?.forEach((semester) => {
    const termName = semester.term || '';
    if (!termName) {
      return;
    }

    if (!groupedModules[termName]) {
      groupedModules[termName] = [];
    }

    semester.studentModules?.forEach((module) => {
      const semesterModule = module.semesterModule;
      const courseModule = semesterModule?.module;

      if (!courseModule) {
        return;
      }

      groupedModules[termName].push({
        code: courseModule.code || '',
        name: courseModule.name || '',
        credit: semesterModule?.credits || 0,
        grade: module.grade || '',
      });
    });
  });

  const sortedTerms = Object.keys(groupedModules).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  sortedTerms.forEach((termName, index) => {
    const modules = groupedModules[termName];
    const totalCredits = modules.reduce((sum, m) => sum + m.credit, 0);

    let gpaSum = 0;
    let totalPoints = 0;
    modules.forEach((m) => {
      const gradePoint = getGradePoints(m.grade);
      if (gradePoint > 0) {
        gpaSum += gradePoint * m.credit;
        totalPoints += m.credit;
      }
    });
    const gpa = totalPoints > 0 ? gpaSum / totalPoints : 0;

    const previousTerms = sortedTerms.slice(0, index + 1);
    let cumulativeCredits = 0;
    let cumulativeGPASum = 0;
    let cumulativeTotalPoints = 0;

    previousTerms.forEach((t) => {
      groupedModules[t].forEach((m) => {
        cumulativeCredits += m.credit;
        const gradePoint = getGradePoints(m.grade);
        if (gradePoint > 0) {
          cumulativeGPASum += gradePoint * m.credit;
          cumulativeTotalPoints += m.credit;
        }
      });
    });

    const cgpa =
      cumulativeTotalPoints > 0 ? cumulativeGPASum / cumulativeTotalPoints : 0;

    termSummaries[termName] = {
      gpa,
      cgpa,
      credits: totalCredits,
      cumulativeCredits,
    };
  });
  const leftTerms = sortedTerms.filter((_, index) => index % 2 === 0);
  const rightTerms = sortedTerms.filter((_, index) => index % 2 === 1);
  const totalCreditsEarned = sortedTerms.reduce((sum, termName) => {
    return sum + groupedModules[termName].reduce((s, m) => s + m.credit, 0);
  }, 0);
  const totalCumulativeCredits =
    sortedTerms.length > 0
      ? termSummaries[sortedTerms[sortedTerms.length - 1]].cumulativeCredits
      : 0;

  function renderColumn(terms: string[], isLeft: boolean) {
    return (
      <View style={isLeft ? styles.leftColumn : styles.rightColumn}>
        {terms.map((termName, termIndex) => {
          const modules = groupedModules[termName] || [];
          const summary = termSummaries[termName];
          const containerStyles = [styles.termContainer];
          if (termIndex === 0) {
            containerStyles.push(styles.firstTermContainer);
          }

          return (
            <View key={termName} style={containerStyles}>
              <Text style={styles.termTitle}>{termName}</Text>

              {modules.map((module, index) => (
                <View
                  key={`${termName}-${module.code}-${index}`}
                  style={styles.moduleRow}
                >
                  <Text style={styles.moduleCode}>{module.code}</Text>
                  <Text style={styles.moduleName}>{module.name}</Text>
                  <Text style={styles.moduleCredit}>{module.credit}</Text>
                  <Text style={styles.moduleGrade}>{module.grade}</Text>
                </View>
              ))}

              {summary ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>GPA</Text>
                    <Text style={styles.summaryColon}>:</Text>
                    <Text style={styles.summaryValue}>
                      {summary.gpa.toFixed(2)}
                    </Text>
                    <View style={styles.summarySpacer} />
                    <Text style={styles.summaryLabel}>Credits Earned</Text>
                    <Text style={styles.summaryColon}>:</Text>
                    <Text style={styles.summaryValue}>{summary.credits}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CGPA</Text>
                    <Text style={styles.summaryColon}>:</Text>
                    <Text style={styles.summaryValue}>
                      {summary.cgpa.toFixed(2)}
                    </Text>
                    <View style={styles.summarySpacer} />
                    <Text style={styles.summaryLabel}>Cumulative Credits</Text>
                    <Text style={styles.summaryColon}>:</Text>
                    <Text style={styles.summaryValue}>
                      {summary.cumulativeCredits}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <Document>
      <Page size='A4' orientation='portrait' style={styles.page}>
        <View style={styles.spacer} />

        <View style={styles.headerTable}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Student Name</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValue}>{student.name}</Text>
            <Text style={styles.headerLabelRight}>Date of Admission</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValueRight}>{admissionDate}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Student ID</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValue}>{student.stdNo}</Text>
            <Text style={styles.headerLabelRight}>Date of Completion</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValueRight}>{completionDate}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>IC / Passport No.</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValue}>{student.nationalId || ''}</Text>
            <Text style={styles.headerLabelRight}>Programme</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValueRight}>{programName}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Gender</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValue}>{student.gender}</Text>
            <Text style={styles.headerLabelRight}>Faculty</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValueRight}>{facultyName}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Nationality</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValue}>{nationality}</Text>
            <Text style={styles.headerLabelRight}>Issued Date</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text style={styles.headerValueRight}>
              {formatDate(new Date())}
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View>
          <View style={styles.moduleTableHeader}>
            <Text style={styles.moduleCode}>Code</Text>
            <Text style={styles.moduleName}>Module Name</Text>
            <Text style={styles.moduleCredit}>Credit</Text>
            <Text style={styles.moduleGrade}>Grade</Text>
          </View>

          <View style={styles.moduleTableContainer}>
            {renderColumn(leftTerms, true)}
            {renderColumn(rightTerms, false)}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total MPU Credits</Text>
            <Text style={styles.footerColon}>:</Text>
            <Text style={styles.footerValue}>-</Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total Credit Transferred</Text>
            <Text style={styles.footerColon}>:</Text>
            <Text style={styles.footerValue}>-</Text>
            <View style={styles.registrarSection}>
              <Text>REGISTRAR</Text>
            </View>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total Credits Earned</Text>
            <Text style={styles.footerColon}>:</Text>
            <Text style={styles.footerValue}>{totalCreditsEarned}</Text>
            <View style={styles.registrarNote}>
              <Text>
                This is not a valid record unless it bears both the stamp and
                signatory on behalf of the university
              </Text>
            </View>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total Cummulative Credits</Text>
            <Text style={styles.footerColon}>:</Text>
            <Text style={styles.footerValue}>{totalCumulativeCredits}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
