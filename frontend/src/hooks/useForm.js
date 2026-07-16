import { useState, useCallback } from "react";


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
