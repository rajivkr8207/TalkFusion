import { useState, useCallback } from "react";

/**
 * useForm — lightweight controlled-form hook.
 *
 * @param {Object} initialValues - initial field values
 * @returns [values, handleChange, resetForm, setValues]
 *
 * Usage:
 *   const [form, handleChange, reset] = useForm({ email: '', password: '' });
 *   <input name="email" value={form.email} onChange={handleChange} />
 */
export const useForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const resetForm = useCallback(() => setValues(initialValues), [initialValues]);

  return [values, handleChange, resetForm, setValues];
};
