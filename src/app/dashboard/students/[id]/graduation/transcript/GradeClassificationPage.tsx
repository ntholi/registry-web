import { Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { grades } from '@/utils/grades';

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

const gradeClassifications = grades
  .filter((g) => g.marksRange || g.grade === 'EXP' || g.grade === 'Def')
  .map((g) => ({
    marks: g.marksRange ? `${g.marksRange.min}-${g.marksRange.max}` : '',
    grade: g.grade,
    gpa: g.points !== null ? g.points.toFixed(2) : '-',
    description: g.description,
  }));

export default function GradeClassificationPage() {
  return (
    <Page size='A4' style={tw('pt-20 px-32 font-sans text-[9pt]')}>
      <View style={tw('flex items-center mb-6')}>
        <Text style={tw('text-[14pt] font-bold')}>
          UNIVERSITY GRADING SYSTEM
        </Text>
      </View>

      <View style={tw('border border-black')}>
        <View style={tw('flex flex-row border-b border-black bg-gray-100')}>
          <View style={tw('w-[25%] border-r border-black p-2')}>
            <Text style={tw('font-bold text-center')}>Marks</Text>
          </View>
          <View style={tw('w-[15%] border-r border-black p-2')}>
            <Text style={tw('font-bold text-center')}>Grade</Text>
          </View>
          <View style={tw('w-[20%] border-r border-black p-2')}>
            <Text style={tw('font-bold text-center')}>GPA & CGPA</Text>
          </View>
          <View style={tw('w-[40%] p-2')}>
            <Text style={tw('font-bold text-center')}>Description</Text>
          </View>
        </View>

        {gradeClassifications.map((item, index) => (
          <View
            key={index}
            style={tw(
              `flex flex-row ${index < gradeClassifications.length - 1 ? 'border-b border-black' : ''}`
            )}
          >
            <View
              style={tw(
                'w-[25%] border-r border-black p-2 flex justify-center'
              )}
            >
              <Text style={tw('text-center')}>{item.marks}</Text>
            </View>
            <View
              style={tw(
                'w-[15%] border-r border-black p-2 flex justify-center'
              )}
            >
              <Text style={tw('text-center font-bold')}>{item.grade}</Text>
            </View>
            <View
              style={tw(
                'w-[20%] border-r border-black p-2 flex justify-center'
              )}
            >
              <Text style={tw('text-center')}>{item.gpa}</Text>
            </View>
            <View style={tw('w-[40%] p-2 flex justify-center')}>
              <Text style={tw('text-center')}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}
