import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart2, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword, error: authError, clearError } = useAuth();

  useEffect(() => {
    if (authError) {
      setError(authError);
    }

    return () => {
      clearError();
    };
  }, [authError, clearError]);

  // Make sure we have the right parameters
  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const type = searchParams.get('type');
    
    if (!access_token || type !== 'recovery') {
      setError('Link de redefinição de senha inválido ou expirado. Por favor, solicite um novo link.');
    }
  }, [searchParams]);

  const validateForm = () => {
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return false;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula');
      return false;
    }
    
    if (!/[a-z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra minúscula');
      return false;
    }
    
    if (!/\d/.test(password)) {
      setError('A senha deve conter pelo menos um número');
      return false;
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('A senha deve conter pelo menos um caractere especial');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      // The error is already set in the useEffect hook
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Senha atualizada com sucesso!</h2>
          <p className="text-gray-600">
            Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em instantes.
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => navigate('/login')}
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <BarChart2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Redefinir Senha</h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite sua nova senha
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Nova Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">Sua senha deve conter:</p>
              <ul className="text-xs space-y-1">
                <li className="flex items-start">
                  <span className={`mr-2 ${/^.{8,}$/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>•</span>
                  <span>Pelo menos 8 caracteres</span>
                </li>
                <li className="flex items-start">
                  <span className={`mr-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>•</span>
                  <span>Pelo menos 1 letra maiúscula</span>
                </li>
                <li className="flex items-start">
                  <span className={`mr-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>•</span>
                  <span>Pelo menos 1 letra minúscula</span>
                </li>
                <li className="flex items-start">
                  <span className={`mr-2 ${/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>•</span>
                  <span>Pelo menos 1 número</span>
                </li>
                <li className="flex items-start">
                  <span className={`mr-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>•</span>
                  <span>Pelo menos 1 caractere especial (@, #, $, etc.)</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Redefinir Senha'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;