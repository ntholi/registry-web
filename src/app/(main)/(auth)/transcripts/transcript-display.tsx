'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/utils/use-media-query';
import { CalendarIcon, ChevronRight } from 'lucide-react';
import { getTranscript } from './actions';

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
      {isDesktop ? (
        program.semesters.map((semester) => (
          <div key={semester.id}>{renderDesktopView(semester)}</div>
        ))
      ) : (
        <Accordion type='single' className='w-full pt-2' collapsible>
          {program.semesters.map((semester) => (
            <AccordionItem
              key={semester.id}
              value={semester.id.toString()}
              className='mt-2 rounded-md border-0'
            >
              <AccordionTrigger className='rounded-md bg-muted p-4 dark:bg-muted/20'>
                <div className='flex w-full items-center justify-between pe-2'>
                  <div className='flex items-center space-x-2'>
                    <CalendarIcon className='h-4 w-4' />
                    <span>{semester.term}</span>
                  </div>
                  <Badge
                    variant={
                      semester.status === 'Active' ? 'outline' : 'destructive'
                    }
                  >
                    {semester.status}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='mt-2 space-y-2'>
                  {semester.modules.map((module) => renderModuleDrawer(module))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}

const renderDesktopView = (semester: Semester) => (
  <div className='my-4 rounded-md border'>
    <div className='flex items-center justify-between bg-muted p-4 dark:bg-muted/50'>
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
  <Drawer key={module.id}>
    <DrawerTrigger asChild>
      <Card className='cursor-pointer space-y-2 rounded p-4 hover:bg-accent'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-light'>{module.name}</p>
            <p className='font-mono text-xs text-muted-foreground'>
              {module.code}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={'outline'}
              className={cn(
                'flex w-9 justify-center py-1',
                passGrades.includes(module.grade as PassGrade)
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400',
              )}
            >
              {module.grade}
            </Badge>
            <ChevronRight className='h-5 w-5 text-muted-foreground' />
          </div>
        </div>
      </Card>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle className='text-2xl font-bold'>{module.name}</DrawerTitle>
        <DrawerDescription className='font-mono text-lg'>
          {module.code}
        </DrawerDescription>
      </DrawerHeader>
      <div className='space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>Type</p>
            <p className='text-lg font-semibold'>{module.type}</p>
          </div>
          <div className='w-14'>
            <p className='text-sm font-medium text-muted-foreground'>Credits</p>
            <p className='text-lg font-semibold'>{module.credits}</p>
          </div>
        </div>
        <div className='flex items-center justify-between'>
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
        <div className='flex flex-col items-center border-t pt-4'>
          <p className='mb-2 text-sm font-medium text-muted-foreground'>
            Marks
          </p>
          <p className='text-3xl font-bold'>
            {module.marks}
            <span className='text-lg text-muted-foreground'>/100</span>
          </p>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
);
