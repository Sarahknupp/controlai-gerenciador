import React from 'react';
import { BarChart2 } from 'lucide-react';

const Logo: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 24, className = "" }) => {
  return <BarChart2 size={size} className={className} />;
};

export default Logo;