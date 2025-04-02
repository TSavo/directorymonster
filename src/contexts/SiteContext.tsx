import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Site } from '../types/site';

interface SiteContextType {
  currentSite: Site | null;
  setCurrentSite: (site: Site | null) => void;
}

export const SiteContext = createContext<SiteContextType>({
  currentSite: null,
  setCurrentSite: () => {},
});

interface SiteProviderProps {
  children: ReactNode;
  initialSite?: Site | null;
}

export const SiteProvider: React.FC<SiteProviderProps> = ({ 
  children, 
  initialSite = null 
}) => {
  const [currentSite, setCurrentSite] = useState<Site | null>(initialSite);

  return (
    <SiteContext.Provider value={{ currentSite, setCurrentSite }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteContext = () => useContext(SiteContext);

export default SiteProvider;
