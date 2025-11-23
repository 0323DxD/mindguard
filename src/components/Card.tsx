import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, title, padding = true, ...props }) => {
  return (
    <div className={`${styles.card} ${padding ? styles.padding : ''} ${className || ''}`} {...props}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {children}
    </div>
  );
};
