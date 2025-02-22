'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useToast } from '@/hooks/use-toast';
import { MAX_REG_MODULES } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getStudentSemesterModules } from '../actions';
import ModuleInput from './ModuleInput';

type Props = {
  stdNo: number;
  structureId: number;
};

const formSchema = z.object({
  modules: z
    .array(z.number())
    .min(1, {
      message: 'You must select at least one module.',
    })
    .max(MAX_REG_MODULES, {
      message: `You can only select up to ${MAX_REG_MODULES} modules.`,
    }),
});

export type RegisterFormSchema = z.infer<typeof formSchema>;

export default function ModulesForm({ stdNo, structureId }: Props) {
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();
  const router = useRouter();

  const { data: semester, isLoading } = useQuery({
    queryKey: ['semesterModules', structureId],
    queryFn: () => getStudentSemesterModules(stdNo, structureId),
  });

  const { mutate: submitRegistration, isPending } = useMutation({
    mutationFn: async (values: RegisterFormSchema) => {
      if (!semester) throw new Error('No modules available');
      if (!currentTerm) throw new Error('No current term found');

      const selectedModules = values.modules.map((moduleId) => {
        const found = semester.modules.find((it) => it.id === moduleId);
        if (found) {
          return found;
        }
      });
      sessionStorage.setItem(
        'selectedModules',
        JSON.stringify(selectedModules),
      );
    },
    onSuccess: () => {
      router.push('/registration/clearance');
    },
    onError: (error) => {
      toast({
        title: 'Error submitting registration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<RegisterFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modules: [],
    },
  });

  function onSubmit(values: RegisterFormSchema) {
    submitRegistration(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between border-b pb-4'>
            <h3 className='hidden text-lg font-semibold sm:block'>
              Available Modules
            </h3>
            <p className='text-sm text-muted-foreground'>
              Select the modules to register for
            </p>
          </div>
          {isLoading ? (
            <LoadingSkeleton />
          ) : semester ? (
            <div className='space-y-4'>
              {semester.modules.map((module) => (
                <ModuleInput
                  key={module.id}
                  control={form.control}
                  module={module}
                  failedPrerequisites={module.prerequisites}
                />
              ))}
            </div>
          ) : null}
        </div>

        {form.formState.errors.modules && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {form.formState.errors.modules.message}
            </AlertDescription>
          </Alert>
        )}

        <div className='flex flex-col justify-end gap-4 border-t pt-4 sm:flex-row'>
          <Button
            type='submit'
            size='lg'
            className='w-full sm:w-auto'
            disabled={isPending || isLoading}
          >
            {isPending ? 'Submitting...' : 'Register Selected Modules'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='flex items-start gap-2 p-4'>
          <Skeleton className='mt-1 h-4 w-4' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-4 w-1/4' />
          </div>
        </div>
      ))}
    </>
  );
}
