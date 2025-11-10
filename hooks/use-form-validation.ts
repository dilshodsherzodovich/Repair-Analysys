"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import type { z } from "zod";
import { validateForm, validateField } from "@/lib/validation";

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (data: T) => Promise<void> | void;
  onError?: (errors: Record<string, string>) => void;
}

export interface FormState<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues = {},
  validateOnChange = false,
  validateOnBlur = true,
  onSubmit,
  onError,
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false,
  });

  // Validate entire form
  const validateFormData = useCallback(
    (values: Partial<T>) => {
      const result = validateForm(schema, values);
      return result;
    },
    [schema]
  );

  // Validate single field
  const validateSingleField = useCallback(
    (name: keyof T, value: any) => {
      try {
        const fieldSchema = schema.shape[name as string];
        if (fieldSchema) {
          const result = validateField(fieldSchema, value);
          return result.error || null;
        }
      } catch (error) {
        // If field schema is not available, validate the entire form
        const result = validateFormData({ ...state.values, [name]: value });
        return result.errors[name as string] || null;
      }
      return null;
    },
    [schema, state.values, validateFormData]
  );

  // Set field value
  const setValue = useCallback(
    (name: keyof T, value: any) => {
      setState((prev) => {
        const newValues = { ...prev.values, [name]: value };
        const newErrors = { ...prev.errors };
        const newTouched = { ...prev.touched, [name]: true };

        // Validate on change if enabled
        if (validateOnChange) {
          const fieldError = validateSingleField(name, value);
          if (fieldError) {
            newErrors[name as string] = fieldError;
          } else {
            delete newErrors[name as string];
          }
        }

        const isDirty = Object.keys(newValues).some(
          (key) => newValues[key] !== initialValues[key]
        );

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          touched: newTouched,
          isDirty,
        };
      });
    },
    [validateOnChange, validateSingleField, initialValues]
  );

  // Set multiple values
  const setValues = useCallback((values: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, ...values },
      isDirty: true,
    }));
  }, []);

  // Set field error
  const setError = useCallback((name: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  // Clear field error
  const clearError = useCallback((name: keyof T) => {
    setState((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[name as string];
      return { ...prev, errors: newErrors };
    });
  }, []);

  // Handle field blur
  const handleBlur = useCallback(
    (name: keyof T) => {
      setState((prev) => {
        const newTouched = { ...prev.touched, [name]: true };
        const newErrors = { ...prev.errors };

        // Validate on blur if enabled
        if (validateOnBlur) {
          const fieldError = validateSingleField(name, prev.values[name]);
          if (fieldError) {
            newErrors[name as string] = fieldError;
          } else {
            delete newErrors[name as string];
          }
        }

        return {
          ...prev,
          touched: newTouched,
          errors: newErrors,
        };
      });
    },
    [validateOnBlur, validateSingleField]
  );

  // Submit form
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const result = validateFormData(state.values);

        if (!result.isValid) {
          setState((prev) => ({
            ...prev,
            errors: result.errors,
            isSubmitting: false,
          }));
          onError?.(result.errors);
          return;
        }

        if (onSubmit && result.data) {
          await onSubmit(result.data);
        }

        setState((prev) => ({
          ...prev,
          errors: {},
          isSubmitting: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Произошла ошибка";
        setState((prev) => ({
          ...prev,
          errors: { submit: errorMessage },
          isSubmitting: false,
        }));
        onError?.({ submit: errorMessage });
      }
    },
    [state.values, validateFormData, onSubmit, onError]
  );

  // Reset form
  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      isDirty: false,
    });
  }, [initialValues]);

  // Update isValid when values or errors change
  useEffect(() => {
    const result = validateFormData(state.values);
    setState((prev) => ({
      ...prev,
      isValid: result.isValid,
    }));
  }, [state.values, validateFormData]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    setValue,
    setValues,
    setError,
    clearError,
    handleBlur,
    handleSubmit,
    reset,
    validateField: validateSingleField,
    validateForm: () => validateFormData(state.values),
  };
}
