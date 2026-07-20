import React from 'react';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  className = 'header',
  style,
  children,
}) => {
  return (
    <header className={className} style={style}>
      <div>
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
};
