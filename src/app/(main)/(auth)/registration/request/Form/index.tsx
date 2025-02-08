'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSemesterModules, getFailedPrerequisites } from '../actions';
import ModuleInput from './ModuleInput';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MAX_REG_MODULES } from '@/lib/constants';

type Props = {
  stdNo: number;
  structureId: number;
  semester: number;
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

export default function ModulesForm({ stdNo, structureId, semester }: Props) {
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();
  const router = useRouter();

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['semesterModules', structureId, semester],
    queryFn: () => getSemesterModules(stdNo, structureId, semester),
  });

  const { data: failedPrerequisites, isLoading: prerequisitesLoading } = useQuery({
    queryKey: ['failedPrerequisites', stdNo],
    queryFn: () => getFailedPrerequisites(stdNo),
  });

  const isLoading = modulesLoading || prerequisitesLoading;

  const { mutate: submitRegistration, isPending } = useMutation({
    mutationFn: async (values: RegisterFormSchema) => {
      if (!modules) throw new Error('No modules available');
      if (!currentTerm) throw new Error('No current term found');

      const selectedModules = values.modules.map((moduleId) => {
        const found = modules.find((it) => it.id === moduleId);
        if (found) {
          return found;
        }
      });
      sessionStorage.setItem(
        'selectedModules',
        JSON.stringify(selectedModules)
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
          <div className='flex items-center justify-between pb-4 border-b'>
            <h3 className='hidden sm:block text-lg font-semibold'>
              Available Modules
            </h3>
            <p className='text-sm text-muted-foreground'>
              Select the modules to register for
            </p>
          </div>
          {isLoading ? (
            <LoadingSkeleton />
          ) : modules ? (
            <div className='space-y-4'>
              {modules.map((module) => (
                <ModuleInput
                  key={module.id}
                  control={form.control}
                  module={module}
                  failedPrerequisites={failedPrerequisites?.[module.code] || []}
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

        <div className='flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t'>
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
          <Skeleton className='h-4 w-4 mt-1' />
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-4 w-1/4' />
          </div>
        </div>
      ))}
    </>
  );
}
