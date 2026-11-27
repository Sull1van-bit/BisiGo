import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { playSfx } from '../utils/audio';

export type DuoButtonVariant =
  | 'blue'
  | 'cobalt'
  | 'mint'
  | 'white'
  | 'white-blue'
  | 'red'
  | 'gold'
  | 'ghost';

export type DuoButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  children: ReactNode;
  variant?: DuoButtonVariant;
  size?: DuoButtonSize;
  className?: string;
  fullWidth?: boolean;
}

interface ButtonAsButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  to?: never;
}

interface ButtonAsLinkProps extends BaseProps {
  to: string;
  disabled?: boolean;
  onClick?: () => void;
}

export type DuoButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export const DuoButton: React.FC<DuoButtonProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  className = '',
  fullWidth = false,
  to,
  disabled = false,
  ...rest
}) => {
  const variantStyles: Record<DuoButtonVariant, string> = {
    blue:
      'bg-[#1A8CFF] hover:bg-[#339BFF] text-white font-extrabold uppercase tracking-wider shadow-[0_4px_0_#0066CC] active:translate-y-[4px] active:shadow-none',
    cobalt:
      'bg-[#3B5BDB] hover:bg-[#4C6EF5] text-white font-extrabold uppercase tracking-wider shadow-[0_4px_0_#2B44A8] active:translate-y-[4px] active:shadow-none',
    mint:
      'bg-[#12B886] hover:bg-[#20C997] text-white font-extrabold uppercase tracking-wider shadow-[0_4px_0_#0CA678] active:translate-y-[4px] active:shadow-none',
    white:
      'bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#273549] text-[#1E293B] dark:text-[#F8FAFC] border-2 border-[#E2E8F0] dark:border-[#334155] font-bold shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] active:translate-y-[4px] active:shadow-none',
    'white-blue':
      'bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#273549] text-[#1A8CFF] dark:text-[#60B2FF] border-2 border-[#E2E8F0] dark:border-[#334155] font-extrabold uppercase tracking-wider shadow-[0_4px_0_#CBD5E1] dark:shadow-[0_4px_0_#070B14] active:translate-y-[4px] active:shadow-none',
    red:
      'bg-[#FF4B4B] hover:bg-[#FF5F5F] text-white font-extrabold uppercase tracking-wider shadow-[0_4px_0_#EA2B2B] active:translate-y-[4px] active:shadow-none',
    gold:
      'bg-[#FFC800] hover:bg-[#FFD324] text-[#7A5600] font-extrabold uppercase tracking-wider shadow-[0_4px_0_#E5B400] active:translate-y-[4px] active:shadow-none',
    ghost:
      'bg-transparent hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F8FAFC] font-extrabold uppercase tracking-wider shadow-none active:translate-y-0',
  };

  const sizeStyles: Record<DuoButtonSize, string> = {
    sm: 'px-4 py-2 text-xs rounded-xl',
    md: 'px-5 py-3 text-sm rounded-2xl',
    lg: 'px-6 py-3.5 text-base rounded-2xl',
  };

  const baseStyles =
    'inline-flex items-center justify-center select-none cursor-pointer transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8CFF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0F172A]';

  const disabledStyles = disabled
    ? 'bg-[#E2E8F0] dark:bg-[#1E293B] text-[#94A3B8] dark:text-[#64748B] rounded-2xl shadow-none cursor-not-allowed uppercase font-extrabold tracking-wider border-0 active:translate-y-0'
    : '';

  const widthStyle = fullWidth ? 'w-full' : '';

  const activeVariant = disabled ? '' : variantStyles[variant];
  const combinedClass = `${baseStyles} ${activeVariant} ${sizeStyles[size]} ${disabledStyles} ${widthStyle} ${className}`;

  if (to) {
    return (
      <Link
        to={disabled ? '#' : to}
        className={combinedClass}
        aria-disabled={disabled}
        onClick={e => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          playSfx('click');
          (rest as ButtonAsLinkProps).onClick?.();
        }}
      >
        {children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      className={combinedClass}
      disabled={disabled}
      {...buttonProps}
      onClick={e => {
        if (disabled) return;
        playSfx('click');
        buttonProps.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
};
