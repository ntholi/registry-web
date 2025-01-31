'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSemesterModules } from './actions';
import {
  createRegistrationRequest,
  createRequestedModules,
} from '@/server/registration-requests/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentTerm } from '@/hooks/use-current-term';

type Props = {
  stdNo: number;
  structureId: number;
  semester: number;
};

const formSchema = z.object({
  modules: z.array(z.string()).min(1, {
    message: 'You must select at least one module.',
  }),
});

export default function RegisterForm({ stdNo, structureId, semester }: Props) {
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();
  const router = useRouter();

  const { data: modules } = useQuery({
    queryKey: ['semesterModules', structureId, semester],
    queryFn: () => getSemesterModules(structureId, semester),
  });

  const { mutate: submitRegistration, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const registrationRequest = {
        stdNo,
        termId: currentTerm!.id,
        status: 'pending' as const,
      };

      const request = await createRegistrationRequest(registrationRequest);

      // Create requested modules
      const requestedModules = values.modules.map((moduleCode) => {
        const foundModule = modules?.find((m) => m.code === moduleCode);
        if (!foundModule) throw new Error(`Module ${moduleCode} not found`);

        return {
          moduleId: foundModule.id,
          registrationRequestId: request.id,
          moduleStatus: 'Compulsory' as const,
        };
      });

      await createRequestedModules(requestedModules);

      return request;
    },
    onSuccess: () => {
      toast({
        title: 'Registration submitted successfully',
        description: 'Your registration request is pending approval.',
      });
      router.push('/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Error submitting registration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modules: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
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

          <div className='space-y-4'>
            {modules?.map((module) => (
              <FormField
                key={module.code}
                control={form.control}
                name='modules'
                render={({ field }) => (
                  <FormItem className='relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring'>
                    <FormControl>
                      <Checkbox
                        className='order-1 after:absolute after:inset-0'
                        checked={field.value?.includes(module.code)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...field.value, module.code])
                            : field.onChange(
                                field.value?.filter(
                                  (value) => value !== module.code
                                )
                              );
                        }}
                      />
                    </FormControl>
                    <div className='grid grow gap-1.5'>
                      <FormLabel className='text-base font-medium'>
                        {module.name}
                      </FormLabel>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <span className='font-mono'>{module.code}</span>
                        <span>•</span>
                        <span className='capitalize'>{module.type}</span>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className='flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t'>
          <Button
            type='submit'
            size='lg'
            className='w-full sm:w-auto'
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Register Selected Modules'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
