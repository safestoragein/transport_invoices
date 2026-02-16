import React from 'react';

/**
 * FormField component - Input wrapper with label and error handling
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  helpText,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const inputId = `field-${name}`;

  const baseInputStyles = `
    w-full px-4 py-3
    border rounded-lg
    text-gray-900 placeholder-gray-400
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  const normalStyles = 'border-gray-300 focus:border-primary-500 focus:ring-primary-200';
  const errorStyles = 'border-danger-300 focus:border-danger-500 focus:ring-danger-200';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          ${baseInputStyles}
          ${error ? errorStyles : normalStyles}
          ${inputClassName}
        `}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-sm text-danger-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

/**
 * TextArea component
 */
export const TextArea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  rows = 3,
  helpText,
  className = '',
  ...props
}) => {
  const inputId = `field-${name}`;

  const baseStyles = `
    w-full px-4 py-3
    border rounded-lg
    text-gray-900 placeholder-gray-400
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-100 disabled:cursor-not-allowed
    resize-none
  `;

  const normalStyles = 'border-gray-300 focus:border-primary-500 focus:ring-primary-200';
  const errorStyles = 'border-danger-300 focus:border-danger-500 focus:ring-danger-200';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`${baseStyles} ${error ? errorStyles : normalStyles}`}
        {...props}
      />

      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}

      {helpText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

/**
 * Select component
 */
export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  helpText,
  className = '',
  ...props
}) => {
  const inputId = `field-${name}`;

  const baseStyles = `
    w-full px-4 py-3
    border rounded-lg
    text-gray-900
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-100 disabled:cursor-not-allowed
    appearance-none bg-white
    bg-no-repeat bg-right
  `;

  const normalStyles = 'border-gray-300 focus:border-primary-500 focus:ring-primary-200';
  const errorStyles = 'border-danger-300 focus:border-danger-500 focus:ring-danger-200';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} pr-10`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}

      {helpText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

/**
 * Checkbox component
 */
export const Checkbox = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = `field-${name}`;

  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={inputId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="
          w-4 h-4
          text-primary-600
          border-gray-300 rounded
          focus:ring-primary-500 focus:ring-2
          disabled:opacity-50
        "
        {...props}
      />
      {label && (
        <label
          htmlFor={inputId}
          className="ml-2 text-sm text-gray-700 cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
};

/**
 * FormRow - Grid layout for form fields
 */
export const FormRow = ({ children, columns = 2, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns] || gridCols[2]} ${className}`}>
      {children}
    </div>
  );
};

export default FormField;
