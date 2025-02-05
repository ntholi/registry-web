'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMediaQuery } from '@/utils/use-media-query';
import { CalendarIcon } from 'lucide-react';
import { getTranscript } from './actions';
import { cn } from '@/lib/utils';

const passGrades = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'PC',
  'PX',
] as const;
type PassGrade = (typeof passGrades)[number];

type Props = {
  program: Awaited<ReturnType<typeof getTranscript>>[number];
};
type Semester = NonNullable<Props['program']>['semesters'][number];
type Module = NonNullable<Semester['modules']>[number];

export function TranscriptDisplay({ program }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <>
      {program.semesters.map((semester) => (
        <div key={semester.id}>
          {isDesktop ? renderDesktopView(semester) : renderMobileView(semester)}
        </div>
      ))}
    </>
  );
}

const renderDesktopView = (semester: Semester) => (
  <div className='rounded-md border my-4'>
    <div className='bg-muted dark:bg-muted/50 p-4 flex justify-between items-center'>
      <div className='flex items-center space-x-2'>
        <CalendarIcon className='h-4 w-4' />
        <span>{semester.term}</span>
      </div>
      <Badge variant={semester.status === 'Active' ? 'outline' : 'destructive'}>
        {semester.status}
      </Badge>
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Module Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Marks</TableHead>
          <TableHead>Grade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {semester.modules.map((module) => (
          <TableRow key={module.id}>
            <TableCell className='font-mono'>{module.code}</TableCell>
            <TableCell>{module.name}</TableCell>
            <TableCell>{module.type}</TableCell>
            <TableCell>{module.credits}</TableCell>
            <TableCell>{module.marks}</TableCell>
            <TableCell>
              <Badge
                variant={
                  passGrades.includes(module.grade as PassGrade)
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {module.grade}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const renderModuleDrawer = (module: Module) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Card className='p-4 space-y-2 cursor-pointer hover:bg-accent'>
        <div className='flex justify-between items-center'>
          <div>
            <p className='font-medium'>{module.name}</p>
            <p className='text-sm text-muted-foreground font-mono'>
              {module.code}
            </p>
          </div>
          <Badge
            variant={'outline'}
            className={cn(
              passGrades.includes(module.grade as PassGrade)
                ? 'text-white'
                : 'text-red-400'
            )}
          >
            {module.grade}
          </Badge>
        </div>
      </Card>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle className='text-2xl font-bold'>{module.name}</DrawerTitle>
        <DrawerDescription className='text-lg font-mono'>
          {module.code}
        </DrawerDescription>
      </DrawerHeader>
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Type</p>
            <p className='text-lg font-semibold'>{module.type}</p>
          </div>

          <div className='w-14'>
            <p className='text-sm font-medium text-muted-foreground'>Credits</p>
            <p className='text-lg font-semibold'>{module.credits}</p>
          </div>
        </div>

        <div className='flex justify-between items-center'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Status</p>
            <Badge className='mt-1' variant='outline'>
              {module.status}
            </Badge>
          </div>

          <div className='w-14'>
            <p className='text-sm font-medium text-muted-foreground'>Grade</p>
            <Badge
              className='mt-1'
              variant={
                passGrades.includes(module.grade as PassGrade)
                  ? 'default'
                  : 'destructive'
              }
            >
              {module.grade}
            </Badge>
          </div>
        </div>
        <div className='pt-4 border-t flex flex-col items-center'>
          <p className='text-sm font-medium text-muted-foreground mb-2'>
            Marks
          </p>
          <p className='text-3xl font-bold'>
            {module.marks}
            <span className='text-muted-foreground text-lg'>/100</span>
          </p>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
);

const renderMobileView = (semester: Semester) => (
  <div className='space-y-4 my-4'>
    <div className='flex justify-between items-center bg-muted dark:bg-muted/40 p-4 rounded-md'>
      <div className='flex items-center space-x-2'>
        <CalendarIcon className='h-4 w-4' />
        <span>{semester.term}</span>
      </div>
      <Badge variant={semester.status === 'Active' ? 'outline' : 'destructive'}>
        {semester.status}
      </Badge>
    </div>
    <div className='space-y-2'>
      {semester.modules.map((module) => renderModuleDrawer(module))}
    </div>
  </div>
);
