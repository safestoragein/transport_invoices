import React from 'react';

/**
 * Card component - Container with shadow and rounded corners
 */
const Card = ({
  children,
  className = '',
  padding = 'default',
  hover = false,
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-card
        ${hover ? 'hover:shadow-hover transition-shadow duration-200' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Header
 */
export const CardHeader = ({
  children,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center justify-between
        pb-4 mb-4 border-b border-gray-100
        ${className}
      `}
    >
      <div>
        {title && (
          <h2 className="text-lg font-semibold text-primary-600">{title}</h2>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
        {!title && !subtitle && children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * Card Body
 */
export const CardBody = ({ children, className = '' }) => {
  return <div className={`${className}`}>{children}</div>;
};

/**
 * Card Footer
 */
export const CardFooter = ({ children, className = '', border = true }) => {
  return (
    <div
      className={`
        pt-4 mt-4
        ${border ? 'border-t border-gray-100' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
