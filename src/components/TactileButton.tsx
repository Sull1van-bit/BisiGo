import React from 'react';
import { DuoButton, DuoButtonVariant, DuoButtonSize } from './DuoButton';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'subtle' | 'white-blue';
export type ButtonSize = DuoButtonSize;

export interface TactileButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
  to?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  variant = 'primary',
  to,
  ...rest
}) => {
  const variantMap: Record<ButtonVariant, DuoButtonVariant> = {
    primary: 'blue',
    secondary: 'white',
    accent: 'gold',
    danger: 'red',
    subtle: 'white',
    'white-blue': 'white-blue',
  };

  if (to) {
    return <DuoButton to={to} variant={variantMap[variant]} {...rest} />;
  }
  return <DuoButton variant={variantMap[variant]} {...rest} />;
};

export { DuoButton } from './DuoButton';
