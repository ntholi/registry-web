'use client';

import { assessments } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput, NumberInput, Select, Grid } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type Assessment = typeof assessments.$inferInsert;

type Props = {
  onSubmit: (values: Assessment) => Promise<Assessment>;
  defaultValues?: Assessment;
  onSuccess?: (value: Assessment) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function AssessmentForm({
  onSubmit,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['assessments']}
      schema={createInsertSchema(assessments)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/assessments/${id}`);
      }}
    >
      {(form) => (
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label='No'
              searchable
              clearable
              placeholder='Assessment (Course Work) Number'
              data={assessmentNumberOptions}
              {...form.getInputProps('assessmentNumber')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label='Assessment Type'
              searchable
              clearable
              data={assessmentTypeOptions}
              {...form.getInputProps('assessmentType')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label='Total Marks'
              {...form.getInputProps('totalMarks')}
              min={1}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label='Weight'
              {...form.getInputProps('weight')}
              min={1}
              max={100}
            />
          </Grid.Col>
        </Grid>
      )}
    </Form>
  );
}

const assessmentNumberOptions = [
  { value: 'CW1', label: 'Course Work 1' },
  { value: 'CW2', label: 'Course Work 2' },
  { value: 'CW3', label: 'Course Work 3' },
  { value: 'CW4', label: 'Course Work 4' },
  { value: 'CW5', label: 'Course Work 5' },
  { value: 'CW6', label: 'Course Work 6' },
  { value: 'CW7', label: 'Course Work 7' },
  { value: 'CW8', label: 'Course Work 8' },
  { value: 'CW9', label: 'Course Work 9' },
  { value: 'CW10', label: 'Course Work 10' },
  { value: 'CW11', label: 'Course Work 11' },
  { value: 'CW12', label: 'Course Work 12' },
  { value: 'CW13', label: 'Course Work 13' },
  { value: 'CW14', label: 'Course Work 14' },
  { value: 'CW15', label: 'Course Work 15' },
];

const assessmentTypeOptions = [
  { value: '1', label: 'Article' },
  { value: '2', label: 'Assignment' },
  { value: '3', label: 'Assignment 1' },
  { value: '4', label: 'Assignment 2' },
  { value: '5', label: 'Assignment 3' },
  { value: '6', label: 'Assignment 4' },
  { value: '74', label: 'Assignment 5' },
  { value: '75', label: 'Assignment 6' },
  { value: '76', label: 'Assignment 7' },
  { value: '69', label: 'Attendance' },
  { value: '85', label: 'CAD' },
  { value: '8', label: 'Case Study' },
  { value: '7', label: 'Class Assignment' },
  { value: '47', label: 'Class Test 1' },
  { value: '48', label: 'Class Test 2' },
  { value: '61', label: 'Class Test 3' },
  { value: '94', label: 'ColorProcessing' },
  { value: '97', label: 'Company Assessment' },
  { value: '71', label: 'Creativity & Design Aesthetic' },
  { value: '96', label: 'CreativityandComposition' },
  { value: '92', label: 'Data Analysis' },
  { value: '100', label: 'Dissertation' },
  { value: '84', label: 'Drawing' },
  { value: '9', label: 'Essay Writing' },
  { value: '11', label: 'Exercise 1' },
  { value: '12', label: 'Exercise 2' },
  { value: '13', label: 'Exercise 3' },
  { value: '14', label: 'Exercise 4' },
  { value: '15', label: 'Exercise 5' },
  { value: '16', label: 'Exercise 6' },
  { value: '10', label: 'Exercises' },
  { value: '87', label: 'Extra Mark' },
  { value: '17', label: 'Final Exam' },
  { value: '78', label: 'Final Film' },
  { value: '18', label: 'Final Project' },
  { value: '19', label: 'Final Report' },
  { value: '20', label: 'Group Assignment' },
  { value: '21', label: 'Group Assignment 1' },
  { value: '22', label: 'Group Assignment 2' },
  { value: '24', label: 'Group Presentation' },
  { value: '23', label: 'Group Project' },
  { value: '25', label: 'Journal' },
  { value: '26', label: 'Lab Test 1' },
  { value: '27', label: 'Lab Test 2' },
  { value: '28', label: 'Literature Review' },
  { value: '99', label: 'Log Book' },
  { value: '29', label: 'Mid-Term Test' },
  { value: '83', label: 'Mock Up Study' },
  { value: '73', label: 'Neatness' },
  { value: '72', label: 'Originality' },
  { value: '37', label: 'Participation' },
  { value: '95', label: 'PhotoManipulation' },
  { value: '86', label: 'Preliminary Model & Rapid Prototype' },
  { value: '36', label: 'Presentation' },
  { value: '60', label: 'Presentation 1' },
  { value: '62', label: 'Presentation 2' },
  { value: '64', label: 'Presentation 3' },
  { value: '91', label: 'Primary Research' },
  { value: '89', label: 'Progression' },
  { value: '31', label: 'Project' },
  { value: '32', label: 'Project 1' },
  { value: '33', label: 'Project 2' },
  { value: '34', label: 'Project 3' },
  { value: '35', label: 'Proposal' },
  { value: '81', label: 'Public Service Announcement' },
  { value: '30', label: 'Public Speaking' },
  { value: '90', label: 'Qualitative and Quantitative Research' },
  { value: '39', label: 'Quiz 1' },
  { value: '40', label: 'Quiz 2' },
  { value: '41', label: 'Quiz 3' },
  { value: '42', label: 'Quiz 4' },
  { value: '43', label: 'Quiz 5' },
  { value: '38', label: 'Quizzes' },
  { value: '93', label: 'Referencing and Citations' },
  { value: '98', label: 'Report' },
  { value: '44', label: 'Report Writing' },
  { value: '77', label: 'Script' },
  { value: '46', label: 'Seminar' },
  { value: '79', label: 'Short Film' },
  { value: '65', label: 'Speech' },
  { value: '66', label: 'Speech 1' },
  { value: '67', label: 'Speech 2' },
  { value: '68', label: 'Speech 3' },
  { value: '45', label: 'Supervisor Contribution' },
  { value: '88', label: 'System Demonstration' },
  { value: '70', label: 'Technical Skills' },
  { value: '80', label: 'Treatment' },
  { value: '49', label: 'Tutorial 1' },
  { value: '57', label: 'Tutorial 10' },
  { value: '50', label: 'Tutorial 2' },
  { value: '51', label: 'Tutorial 3' },
  { value: '52', label: 'Tutorial 4' },
  { value: '53', label: 'Tutorial 5' },
  { value: '54', label: 'Tutorial 6' },
  { value: '55', label: 'Tutorial 7' },
  { value: '56', label: 'Tutorial 8' },
  { value: '63', label: 'Tutorial 9' },
  { value: '58', label: 'Tutorials' },
  { value: '82', label: 'TV Commercial' },
  { value: '59', label: 'Workshop' },
];
