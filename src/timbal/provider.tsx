import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSession } from '@/auth/provider';
import { Timbal } from './client';
import { TimbalConfig } from './types';

const TimbalContext = createContext<Timbal | null>(null);

interface TimbalProviderProps {
    children: ReactNode;
    config?: Omit<TimbalConfig, 'sessionToken'>;
}

/**
 * Provider that creates a single Timbal instance and makes it available throughout the app
 * Automatically handles session token updates
 */
export function TimbalProvider({ children, config = {} }: TimbalProviderProps) {
    const { session } = useSession();
    
    const timbal = useMemo(() => {
        return new Timbal({
            ...config,
            sessionToken: session?.access_token
        });
    }, [session, config.apiKey, config.baseUrl]);
    
    return (
        <TimbalContext.Provider value={timbal}>
            {children}
        </TimbalContext.Provider>
    );
}

/**
 * Hook to access the Timbal client instance
 * Must be used within a TimbalProvider
 */
export function useTimbal(): Timbal {
    const timbal = useContext(TimbalContext);
    if (!timbal) {
        throw new Error('useTimbal must be used within a TimbalProvider');
    }
    return timbal;
}
