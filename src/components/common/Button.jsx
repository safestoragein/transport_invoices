import React from 'react';

const variantStyles = {
  primary: `
    bg-gradient-to-r from-primary-600 to-primary-500 text-white
    hover:from-primary-700 hover:to-primary-600
    focus:ring-primary-500
    shadow-md hover:shadow-lg
  `,
  secondary: `
    bg-gray-100 text-gray-700 border border-gray-300
    hover:bg-gray-200
    focus:ring-gray-500
  `,
  success: `
    bg-gradient-to-r from-success-600 to-success-500 text-white
    hover:from-success-700 hover:to-success-600
    focus:ring-success-500
    shadow-md hover:shadow-lg
  `,
  danger: `
    bg-gradient-to-r from-danger-600 to-danger-500 text-white
    hover:from-danger-700 hover:to-danger-600
    focus:ring-danger-500
    shadow-md hover:shadow-lg
  `,
  warning: `
    bg-gradient-to-r from-warning-500 to-warning-400 text-white
    hover:from-warning-600 hover:to-warning-500
    focus:ring-warning-500
    shadow-md hover:shadow-lg
  `,
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100
    focus:ring-gray-500
  `,
  link: `
    bg-transparent text-primary-600 underline-offset-4
    hover:underline
    focus:ring-primary-500
    p-0
  `,
};

const sizeStyles = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  xl: 'px-6 py-3 text-lg',
};

/**
 * Button component with multiple variants and sizes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const loadingSpinner = (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && loadingSpinner}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};

/**
 * Icon Button - Button with only an icon
 */
export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}) => {
  const sizeMap = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`
        inline-flex items-center justify-center
        rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantStyles[variant]}
        ${sizeMap[size]}
        ${className}
      `}
      {...props}
    >
      {icon}
    </button>
  );
};

/**
 * Button Group - Group multiple buttons together
 */
export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-lg shadow-sm ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;

        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            ${index === 0 ? 'rounded-r-none' : ''}
            ${index === React.Children.count(children) - 1 ? 'rounded-l-none' : ''}
            ${index !== 0 && index !== React.Children.count(children) - 1 ? 'rounded-none' : ''}
            ${index !== 0 ? '-ml-px' : ''}
          `,
        });
      })}
    </div>
  );
};

export default Button;
