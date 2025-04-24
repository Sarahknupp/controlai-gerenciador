import React from 'react';
import { useGoogleAuth, GOOGLE_API_SCOPES } from '../lib/googleAuth';

interface GoogleAuthButtonProps {
  clientId: string;
  apiKey: string;
  onSuccess?: (user: any) => void;
  onFailure?: (error: Error) => void;
  className?: string;
  buttonText?: string;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  clientId,
  apiKey,
  onSuccess,
  onFailure,
  className = "",
  buttonText = "Entrar com Google"
}) => {
  const scopes = [
    GOOGLE_API_SCOPES.signIn,
    GOOGLE_API_SCOPES.calendar,
    GOOGLE_API_SCOPES.drive
  ];
  
  const { isInitialized, isSignedIn, user, signIn, signOut } = useGoogleAuth();

  React.useEffect(() => {
    // Inicializa a API do Google quando o componente for montado
    const initializeGoogleApi = async () => {
      try {
        await window.gapi.client.init({
          apiKey,
          clientId,
          scope: scopes.join(' '),
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
        
        if (isSignedIn && onSuccess) {
          onSuccess(user);
        }
      } catch (error) {
        console.error('Erro ao inicializar Google API:', error);
        if (onFailure && error instanceof Error) {
          onFailure(error);
        }
      }
    };

    if (!isInitialized && window.gapi) {
      initializeGoogleApi();
    }
  }, [apiKey, clientId, isInitialized, isSignedIn, onFailure, onSuccess, scopes, user]);

  const handleSignIn = async () => {
    try {
      await signIn();
      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      if (onFailure && error instanceof Error) {
        onFailure(error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout do Google:', error);
    }
  };

  return (
    <button
      type="button"
      className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`}
      onClick={isSignedIn ? handleSignOut : handleSignIn}
      disabled={!isInitialized}
    >
      {!isInitialized ? (
        <span>Carregando...</span>
      ) : (
        <>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="h-5 w-5 mr-2"
          />
          <span>{isSignedIn ? 'Sair da conta Google' : buttonText}</span>
        </>
      )}
    </button>
  );
};

export default GoogleAuthButton;