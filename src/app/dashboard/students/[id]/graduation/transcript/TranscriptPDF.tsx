import { getCleanedSemesters } from '@/app/dashboard/students/[id]/AcademicsView/statements/utils';
import { getAcademicHistory } from '@/server/students/actions';
import { getGradePoints } from '@/utils/grades';
import { Document, Page, Text, View, Font } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

Font.register({
  family: 'Arial',
  src: '/fonts/ARIAL.TTF',
});

Font.register({
  family: 'Arial-Bold',
  src: '/fonts/ARIALBD.TTF',
});

Font.register({
  family: 'ui-sans-serif',
  src: '/fonts/ARIAL.TTF',
});

Font.register({
  family: 'system-ui',
  src: '/fonts/ARIAL.TTF',
});

Font.register({
  family: 'sans-serif',
  src: '/fonts/ARIAL.TTF',
});

const tw = createTw({
  theme: {
    fontFamily: {
      sans: ['Arial'],
      bold: ['Arial-Bold'],
    },
    extend: {
      colors: {
        border: '#000000',
      },
      borderWidth: {
        DEFAULT: '0.5pt',
      },
    },
  },
});

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
};

type StudentRecord = {
  name: string;
  stdNo: string;
  nationalId: string;
  gender: string;
  nationality: string;
  admissionDate: string;
  program: string;
  faculty: string;
};

type GradeRecord = {
  courseCode: string;
  courseName: string;
  credits: number;
  grade: string;
};

type TermRecord = {
  term: string;
  grades: GradeRecord[];
  gpa: number;
  credits: number;
  cgpa: number;
  cumulativeCredits: number;
};

function HeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={tw('flex flex-row')}>
      <Text style={tw('w-[90pt] font-bold')}>{label}</Text>
      <Text style={tw('w-[10pt] text-center')}>:</Text>
      <Text style={tw('flex-1')}>{value || '-'}</Text>
    </View>
  );
}

function TableHeader() {
  return (
    <View style={tw('flex flex-row font-bold py-1.5')}>
      <Text style={tw('w-[60pt]')}>Code</Text>
      <Text style={tw('flex-1')}>Module Name</Text>
      <Text style={tw('w-[40pt] text-right')}>Credit</Text>
      <Text style={tw('w-[35pt] pl-2.5')}>Grade</Text>
    </View>
  );
}

function GradeRow({ grade }: { grade: GradeRecord }) {
  return (
    <View style={tw('flex flex-row min-h-[7pt]')}>
      <Text style={tw('w-[60pt]')}>{grade.courseCode}</Text>
      <Text style={tw('flex-1')}>{grade.courseName}</Text>
      <Text style={tw('w-[40pt] text-right')}>{grade.credits.toString()}</Text>
      <Text style={tw('w-[35pt] pl-2.5')}>{grade.grade}</Text>
    </View>
  );
}

function TermSummary({ term }: { term: TermRecord }) {
  return (
    <View style={tw('ml-[60pt] mt-0.5 mt-1')}>
      <View style={tw('flex flex-row justify-between w-[84%]')}>
        <View style={tw('w-[60pt] flex-row justify-between')}>
          <Text>GPA</Text>
          <Text>{`:  ${formatDecimal(term.gpa)}`}</Text>
        </View>
        <View style={tw('w-[100pt] flex-row justify-between')}>
          <Text>Credits Earned</Text>
          <View style={tw('flex-row justify-between w-[16pt]')}>
            <Text>:</Text>
            <Text>{term.credits}</Text>
          </View>
        </View>
      </View>
      <View style={tw('flex flex-row justify-between w-[84%]')}>
        <View style={tw('w-[60pt] flex-row justify-between')}>
          <Text>CGPA</Text>
          <Text>{`:  ${formatDecimal(term.cgpa)}`}</Text>
        </View>
        <View style={tw('w-[100pt] flex-row justify-between')}>
          <Text>Cumulative Credits</Text>
          <View style={tw('flex-row justify-between w-[16pt]')}>
            <Text>:</Text>
            <Text>{term.cumulativeCredits}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TermSection({ term }: { term: TermRecord }) {
  return (
    <View style={tw('mb-2.5')}>
      <Text style={tw('mb-0.5 font-bold')}>{term.term}</Text>
      {term.grades.map(function renderGrade(grade, index) {
        return (
          <GradeRow
            key={`${term.term}-${grade.courseCode}-${index}`}
            grade={grade}
          />
        );
      })}
      <TermSummary term={term} />
    </View>
  );
}

export default function TranscriptPDF({ student }: Props) {
  const {
    studentRecord,
    terms,
    totalCreditsEarned,
    totalCumulativeCredits,
    completionDate,
  } = extractTranscriptData(student);
  const leftTerms = terms.slice(0, 6);
  const rightTerms = terms.slice(6);
  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page
        size='A4'
        style={tw('pt-5 px-4 pb-10 font-sans text-[7.12pt] pt-[155pt]')}
      >
        <View style={tw('border-t border-b')}>
          <View style={tw('flex flex-row')}>
            <View style={tw('w-1/2')}>
              <HeaderRow label='Student Name' value={studentRecord.name} />
              <HeaderRow label='Student ID' value={studentRecord.stdNo} />
              <HeaderRow
                label='IC / Passport No.'
                value={studentRecord.nationalId}
              />
              <HeaderRow label='Gender' value={studentRecord.gender} />
              <HeaderRow
                label='Nationality'
                value={studentRecord.nationality}
              />
            </View>
            <View style={tw('w-1/2')}>
              <HeaderRow
                label='Date of Admission'
                value={studentRecord.admissionDate || terms[0]?.term || '-'}
              />
              <HeaderRow label='Date of Completion' value={completionDate} />
              <HeaderRow
                label='Programme'
                value={correctSpelling(studentRecord.program)}
              />
              <HeaderRow label='Faculty' value={studentRecord.faculty} />
              <HeaderRow label='Issued Date' value={issueDate} />
            </View>
          </View>
        </View>

        <View style={tw('mt-2 flex flex-row gap-5 border-t border-b')}>
          <View style={tw('flex-1')}>
            <TableHeader />
          </View>
          <View style={tw('flex-1')}>
            <TableHeader />
          </View>
        </View>

        <View style={tw('mt-2.5 flex flex-row gap-5')}>
          <View style={tw('flex-1')}>
            {leftTerms.map(function renderLeftTerm(term, index) {
              return <TermSection key={`${term.term}-${index}`} term={term} />;
            })}
          </View>
          <View style={tw('flex-1')}>
            {rightTerms.map(function renderRightTerm(term, index) {
              return <TermSection key={`${term.term}-${index}`} term={term} />;
            })}
          </View>
        </View>

        <View style={tw('absolute bottom-[50pt] left-[85pt]')}>
          {['Total MPU Credits', 'Total Credit Transferred'].map(
            function renderFooterPlaceholder(label) {
              return (
                <View key={label} style={tw('flex flex-row')}>
                  <Text style={tw('w-[160pt]')}>{label}</Text>
                  <Text>{':  '}-</Text>
                </View>
              );
            }
          )}
          {['Total Credits Earned', 'Total Cumulative Credits'].map(
            function renderFooterTotal(label, index) {
              const value =
                index === 0 ? totalCreditsEarned : totalCumulativeCredits;
              return (
                <View key={label} style={tw('flex flex-row')}>
                  <Text style={tw('w-[160pt]')}>{label}</Text>
                  <Text>
                    {':  '}
                    {value}
                  </Text>
                </View>
              );
            }
          )}
        </View>

        <View style={tw('absolute bottom-[50pt] right-14 w-[190pt] border-t')}>
          <Text style={tw('pt-1.5 text-center font-bold')}>REGISTRAR</Text>
          <Text>
            This is not a valid record unless it bears both the stamp and
            signatory on behalf of the university
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function extractTranscriptData(student: Props['student']) {
  const programList = student.programs || [];
  const completedPrograms = programList.filter(
    function filterCompleted(program) {
      return program?.status === 'Completed';
    }
  );
  const activePrograms = programList.filter(function filterActive(program) {
    return program?.status === 'Active';
  });
  const primaryProgram =
    completedPrograms[0] || activePrograms[0] || programList[0];
  const programNameRaw = primaryProgram?.structure?.program?.name || '-';
  const correctedProgramName = correctSpelling(programNameRaw);
  const studentDetails = student as Partial<{ nationality: string }>;
  const nationality = studentDetails.nationality || 'Mosotho';
  const admissionDate = formatDisplayDate(primaryProgram?.intakeDate);
  const completionDate = formatDisplayDate(primaryProgram?.graduationDate);
  const facultyFromProgram = primaryProgram?.structure?.program?.school?.name;
  const faculty = facultyFromProgram || safeFindFaculty(correctedProgramName);

  const semesters = getCleanedSemesters(primaryProgram);
  const terms: TermRecord[] = [];
  let cumulativeCredits = 0;
  let totalCreditsEarned = 0;
  let cumulativeGradePoints = 0;
  let cumulativeCreditsForGrade = 0;

  semesters.forEach(function buildTerm(semester) {
    const termName =
      semester.term || `Semester ${semester.semesterNumber ?? ''}`;
    const grades: GradeRecord[] = [];
    let termCredits = 0;
    let termGradePoints = 0;
    let termCreditsForGrade = 0;

    semester.studentModules?.forEach(function accumulateModule(studentModule) {
      const semesterModule = studentModule.semesterModule;
      const courseModule = semesterModule?.module;
      if (!semesterModule || !courseModule) {
        return;
      }

      const credits = Number(semesterModule.credits) || 0;
      const grade = studentModule.grade || '';

      grades.push({
        courseCode: courseModule.code || '',
        courseName: courseModule.name || '',
        credits,
        grade,
      });

      termCredits += credits;
      totalCreditsEarned += credits;

      const gradePoint = getGradePoints(grade);
      if (gradePoint > 0) {
        termGradePoints += gradePoint * credits;
        termCreditsForGrade += credits;
        cumulativeGradePoints += gradePoint * credits;
        cumulativeCreditsForGrade += credits;
      }
    });

    cumulativeCredits += termCredits;

    const gpa =
      termCreditsForGrade > 0 ? termGradePoints / termCreditsForGrade : 0;
    const cgpa =
      cumulativeCreditsForGrade > 0
        ? cumulativeGradePoints / cumulativeCreditsForGrade
        : 0;

    terms.push({
      term: termName,
      grades,
      gpa,
      credits: termCredits,
      cgpa,
      cumulativeCredits,
    });
  });

  const studentRecord: StudentRecord = {
    name: student.name || '-',
    stdNo: student.stdNo ? student.stdNo.toString() : '-',
    nationalId: student.nationalId || '-',
    gender: student.gender || '-',
    nationality,
    admissionDate,
    program: correctedProgramName,
    faculty,
  };

  return {
    studentRecord,
    terms,
    totalCreditsEarned,
    totalCumulativeCredits: cumulativeCredits,
    completionDate,
  };
}

function formatDecimal(value: number) {
  return value > 0 ? value.toFixed(2) : '0.00';
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function safeFindFaculty(programName: string) {
  try {
    return findFaculty(programName);
  } catch {
    return '-';
  }
}

function findFaculty(programName: string) {
  const program = programs.find(function matchProgram(p) {
    return programName.toLowerCase().includes(p.name.toLowerCase());
  });
  if (!program) {
    throw new Error(`Faculty for ${programName} not found`);
  }
  return program.faculty;
}

function correctSpelling(name: string) {
  return name.replace('Entreprenuership', 'Entrepreneurship');
}

const programs = [
  {
    name: 'Architectur',
    faculty: 'Faculty of Architecture and the Built Environment',
  },
  {
    name: 'Entreprenuership',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Entrepreneurship',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Human Resource Management',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'International Business',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Business Management',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Marketing',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Retail Management',
    faculty: 'Faculty of Business and Globalisation',
  },
  {
    name: 'Performing Arts',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Broadcasting',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Professional Communication',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Journalism & Media',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Public Relations',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Broadcasting & Journalism',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Digital Film Production',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Broadcasting Radio & TV',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Film Production',
    faculty: 'Faculty of Communication, Media and Broadcasting',
  },
  {
    name: 'Tourism',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Events Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Event Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Hotel Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'International Tourism',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Tourism Management',
    faculty: 'Faculty of Creativity in Tourism & Hospitality',
  },
  {
    name: 'Professional Design',
    faculty: 'Faculty of Design and Innovation',
  },
  {
    name: 'Creative Advertising',
    faculty: 'Faculty of Design and Innovation',
  },
  {
    name: 'Graphic Design',
    faculty: 'Faculty of Design and Innovation',
  },
  {
    name: 'Fashion & Retailing',
    faculty: 'Faculty of Fashion and Lifestyle Design',
  },
  {
    name: 'Fashion & Apparel Design',
    faculty: 'Faculty of Fashion and Lifestyle Design',
  },
  {
    name: 'Business Information Technology',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Information Technology',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Software Engineering with Multimedia',
    faculty: 'Faculty of Information & Communication Technology',
  },
  {
    name: 'Multimedia & Software Engineering',
    faculty: 'Faculty of Information & Communication Technology',
  },
];
