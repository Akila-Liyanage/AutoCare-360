import React from 'react';
import logoImg from '../../assets/auth/download (27) (1) 2.png';
import bgFadeImg from '../../assets/auth/bg fade 1.png';

interface AuthLayoutProps {
  bgImage: string;
  children: React.ReactNode;
  layoutMode?: 'split' | 'centered';
  hideFade?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  bgImage, 
  children,
  layoutMode = 'split',
  hideFade = false,
}) => {
  const isCentered = layoutMode === 'centered';

  return (
    <div className={`autocare-auth-page ${isCentered ? 'is-centered' : ''}`}>
      {/* Background layer with the real approved image asset */}
      <div 
        className="autocare-auth-visual" 
        style={{ backgroundImage: `url(${bgImage})` }} 
        role="presentation"
        aria-hidden="true"
      />
      
      {/* Real approved fade background asset overlay for the official cyan/green brand transition */}
      {!hideFade && (
        <div 
          className="autocare-auth-fade" 
          style={{ backgroundImage: `url(${bgFadeImg})` }} 
          aria-hidden="true" 
        />
      )}

      {/* Official AutoCare 360 Logo Placement - Top Left */}
      <div className="autocare-auth-logo" aria-label="AutoCare 360 Logo">
        <img 
          src={logoImg} 
          alt="AutoCare 360 - Universal Vehicle Maintenance Record System" 
          className="autocare-auth-logo-img" 
        />
      </div>

      {/* Content Card Container */}
      <main className={`autocare-auth-card-pane ${isCentered ? 'is-centered' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
