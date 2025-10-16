import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Society, SocietyUser, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface SocietyContextType {
  currentSociety: Society | null;
  societies: Society[];
  userRole: UserRole | null;
  loading: boolean;
  selectSociety: (societyId: string) => void;
  refreshSocieties: () => Promise<void>;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentSociety, setCurrentSociety] = useState<Society | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSocieties = async () => {
    if (!user) {
      setSocieties([]);
      setCurrentSociety(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data: societyUsers, error } = await supabase
        .from('society_users')
        .select('society_id, role, societies(*)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const userSocieties = societyUsers?.map((su: any) => su.societies).filter(Boolean) || [];
      setSocieties(userSocieties);

      const savedSocietyId = localStorage.getItem('currentSocietyId');
      const societyToSelect = savedSocietyId
        ? userSocieties.find((s: Society) => s.id === savedSocietyId)
        : userSocieties[0];

      if (societyToSelect) {
        setCurrentSociety(societyToSelect);
        const societyUser = societyUsers?.find((su: any) => su.society_id === societyToSelect.id);
        setUserRole(societyUser?.role || null);
        localStorage.setItem('currentSocietyId', societyToSelect.id);
      }
    } catch (error) {
      console.error('Error fetching societies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, [user]);

  const selectSociety = (societyId: string) => {
    const society = societies.find((s) => s.id === societyId);
    if (society) {
      setCurrentSociety(society);
      localStorage.setItem('currentSocietyId', societyId);

      supabase
        .from('society_users')
        .select('role')
        .eq('society_id', societyId)
        .eq('user_id', user?.id)
        .single()
        .then(({ data }) => {
          if (data) setUserRole(data.role);
        });
    }
  };

  return (
    <SocietyContext.Provider
      value={{
        currentSociety,
        societies,
        userRole,
        loading,
        selectSociety,
        refreshSocieties: fetchSocieties,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const context = useContext(SocietyContext);
  if (context === undefined) {
    throw new Error('useSociety must be used within a SocietyProvider');
  }
  return context;
}
