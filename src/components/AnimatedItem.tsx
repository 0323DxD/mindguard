import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface AnimatedItemProps {
  children: React.ReactNode;
  delay?: number;
  index?: number;
  onMouseEnter?: () => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ 
  children, 
  delay = 0, 
  index = 0,
  onMouseEnter, 
  onClick,
  className = '',
  style = {}
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // once: false means it will animate every time it scrolls into view
  const inView = useInView(ref, { amount: 0.1, once: false });
  
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={inView ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.8, opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay }}
      className={className}
      style={{ ...style, width: '100%' }}
    >
      {children}
    </motion.div>
  );
};
