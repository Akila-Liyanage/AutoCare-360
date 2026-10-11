import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import AuthLayout from './AuthLayout';
import fadeBg from '../../assets/auth/bg fade 1.png';

interface AuthPlaceholderProps {
  title: string;
  phase: string;
  description: string;
}

export const AuthPlaceholder: React.FC<AuthPlaceholderProps> = ({ title, phase, description }) => {
  return (
    <AuthLayout bgImage={fadeBg}>
      <div className="autocare-placeholder-card">
        <div 
          className="autocare-card-shield-badge" 
          style={{ background: 'var(--autocare-blue-light)', color: 'var(--autocare-blue)', border: '1px solid #bfdbfe' }}
        >
          <Clock size={18} />
        </div>
        <span 
          style={{
            background: 'var(--autocare-blue-light)',
            color: 'var(--autocare-blue)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '3px 10px',
            borderRadius: '9999px',
          }}
        >
          {phase}
        </span>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--autocare-gray-900)' }}>
          {title}
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--autocare-gray-600)', margin: 0, lineHeight: 1.5 }}>
          {description}
        </p>
        <Link 
          to="/login" 
          className="autocare-primary-button" 
          style={{ textDecoration: 'none', maxWidth: '220px', marginTop: '6px' }}
        >
          <ArrowLeft size={15} /> Return to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default AuthPlaceholder;
