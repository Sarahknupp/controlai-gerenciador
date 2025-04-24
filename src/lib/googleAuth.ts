import { useEffect, useState } from 'react';

// Tipo para configuração do cliente OAuth
export interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
  discoveryDocs?: string[];
}

// Objeto global do cliente de autenticação do Google
let gAuthClient: any = null;
let gApiInitialized = false;

/**
 * Carrega os scripts do Google API necessários para autenticação
 * @returns Promise que resolve quando os scripts estão carregados
 */
const loadGoogleScripts = (): Promise<void> => {
  return new Promise((resolve) => {
    // Verifica se o script já está carregado
    if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      return resolve();
    }

    // Carrega o script da API do Google
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Carrega o script da biblioteca de autenticação OAuth2 do Google
      window.gapi.load('client:auth2', () => {
        resolve();
      });
    };
    document.body.appendChild(script);
  });
};

/**
 * Inicializa o cliente da API do Google
 * @param config Configuração do cliente OAuth
 * @returns Promise que resolve quando o cliente estiver inicializado
 */
export const initGoogleApi = async (config: GoogleAuthConfig): Promise<void> => {
  if (gApiInitialized) return;

  try {
    await loadGoogleScripts();

    await window.gapi.client.init({
      apiKey: config.apiKey,
      clientId: config.clientId,
      discoveryDocs: config.discoveryDocs || [],
      scope: config.scopes.join(' '),
    });

    gAuthClient = window.gapi.auth2.getAuthInstance();
    gApiInitialized = true;
    
    console.log('Google API inicializada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Google API:', error);
    throw error;
  }
};

/**
 * Hook para utilizar autenticação do Google
 * @returns Objeto com estado e funções de autenticação
 */
export const useGoogleAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(gApiInitialized);

  // Atualiza estado quando o status de autenticação mudar
  const updateSigninStatus = () => {
    if (!gAuthClient) return;

    const authUser = gAuthClient.currentUser.get();
    const signedIn = authUser.isSignedIn();
    
    setIsSignedIn(signedIn);
    
    if (signedIn) {
      const profile = authUser.getBasicProfile();
      const authResponse = authUser.getAuthResponse(true);
      
      setUser({
        id: profile.getId(),
        name: profile.getName(),
        givenName: profile.getGivenName(),
        familyName: profile.getFamilyName(),
        imageUrl: profile.getImageUrl(),
        email: profile.getEmail(),
        accessToken: authResponse.access_token,
        expiresAt: authResponse.expires_at
      });
    } else {
      setUser(null);
    }
  };

  // Função para fazer login
  const signIn = async (): Promise<void> => {
    if (!gAuthClient) throw new Error('Google API não inicializada');
    
    try {
      await gAuthClient.signIn();
      updateSigninStatus();
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      throw error;
    }
  };

  // Função para fazer logout
  const signOut = async (): Promise<void> => {
    if (!gAuthClient) throw new Error('Google API não inicializada');
    
    try {
      await gAuthClient.signOut();
      updateSigninStatus();
    } catch (error) {
      console.error('Erro ao fazer logout do Google:', error);
      throw error;
    }
  };

  // Configura listeners quando o componente montar
  useEffect(() => {
    if (gApiInitialized && gAuthClient) {
      // Atualiza estado inicial
      updateSigninStatus();
      
      // Adiciona listener para mudanças no estado de autenticação
      gAuthClient.isSignedIn.listen(updateSigninStatus);
      
      setIsInitialized(true);
      
      // Remove listener quando o componente desmontar
      return () => {
        if (gAuthClient) {
          gAuthClient.isSignedIn.listen(updateSigninStatus);
        }
      };
    }
  }, [gApiInitialized]);

  return {
    isInitialized,
    isSignedIn,
    user,
    signIn,
    signOut,
  };
};

// Exemplo de constante para escopos necessários
export const GOOGLE_API_SCOPES = {
  signIn: 'profile email',
  calendar: 'https://www.googleapis.com/auth/calendar',
  drive: 'https://www.googleapis.com/auth/drive',
  // Adicionar mais escopos conforme necessário
};

// Interface global para o cliente gapi
declare global {
  interface Window {
    gapi: any;
  }
}