'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ROLES } from '@/shared/roles';
import { errorText } from '@/ui/api-client';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';
import { Button } from '@/ui/primitives/Button';
import { SelectField } from '@/ui/primitives/SelectField';
import { TextField } from '@/ui/primitives/TextField';
import {
  createUserFormSchema,
  type CreateUserFormInput,
  type CreateUserFormValues,
  toCreateUserBody,
} from './users-api';
import { useCreateUser, useManagers } from './users-queries';

const EMPTY: CreateUserFormInput = {
  fullName: '',
  email: '',
  password: '',
  role: '',
  managerId: '',
};

export function CreateUserForm() {
  const form = useForm<CreateUserFormInput, unknown, CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: EMPTY,
  });
  const { errors } = form.formState;
  const managers = useManagers();
  const create = useCreateUser(() => form.reset(EMPTY));
  const formError = create.error ?? managers.error;

  return (
    <form
      className="form"
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          create.mutate(toCreateUserBody(values)),
        )(event)
      }
    >
      <div className="form-grid">
        <TextField
          label="Full name"
          error={errors.fullName?.message}
          {...form.register('fullName')}
        />
        <TextField
          label="Email"
          type="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <SelectField
          label="Role"
          error={errors.role?.message}
          {...form.register('role')}
        >
          <option value="">Select a role</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </SelectField>
        <SelectField label="Manager" {...form.register('managerId')}>
          <option value="">No manager</option>
          {managers.data?.items.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.fullName}
            </option>
          ))}
        </SelectField>
      </div>
      <ErrorMessage error={formError ? errorText(formError) : null} />
      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          pending={create.isPending}
          pendingLabel="Creating…"
        >
          Create user
        </Button>
      </div>
    </form>
  );
}
