import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for form state management
 * @param {object} initialValues - Initial form values
 * @param {function} validate - Validation function
 * @param {function} onSubmit - Submit handler
 */
const useForm = (initialValues = {}, options = {}) => {
  const { validate, onSubmit, resetOnSubmit = false } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate single field on blur
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: validationErrors[name],
        }));
      }
    }
  }, [values, validate]);

  /**
   * Set a single field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Set multiple field values
   */
  const setMultipleValues = useCallback((newValues) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  /**
   * Set a single field error
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  /**
   * Set a field as touched
   */
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback((newInitialValues) => {
    setValues(newInitialValues || initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Validate all fields
   */
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values, validate]);

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    setSubmitCount((prev) => prev + 1);

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate
    const isValid = validateForm();
    if (!isValid) return;

    // Submit
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        if (resetOnSubmit) {
          resetForm();
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit, resetOnSubmit, resetForm]);

  /**
   * Get props for an input field
   */
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
  }), [values, handleChange, handleBlur]);

  /**
   * Get error message for a field (only if touched)
   */
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : undefined;
  }, [touched, errors]);

  /**
   * Check if form is valid
   */
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Check if form is dirty (has changes)
   */
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isValid,
    isDirty,
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    // Setters
    setFieldValue,
    setMultipleValues,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    // Utilities
    resetForm,
    validateForm,
    getFieldProps,
    getFieldError,
  };
};

export default useForm;
