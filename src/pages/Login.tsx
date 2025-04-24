import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resendConfirmationEmail, resetPassword, user, error, clearError } = useAuth();

  useEffect(() => {
    // If the user is already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
    
    // Handle authentication errors from context
    if (error) {
      setLocalError(error);
    }

    return () => {
      // Clear errors when component unmounts
      clearError();
    };
  }, [user, navigate, error, clearError]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      // Error is already handled by the auth context
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // The redirect will be handled by Supabase OAuth
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      await resendConfirmationEmail(email);
      setLocalError('Email de confirmação reenviado. Por favor, verifique sua caixa de entrada.');
    } catch (err) {
      setLocalError('Erro ao reenviar o email de confirmação. Por favor, tente novamente.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setLocalError('Por favor, insira um email válido.');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      clearError();
    } catch (err) {
      setLocalError('Erro ao enviar email de recuperação de senha. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const validateLoginForm = () => {
    if (!email) {
      setLocalError('Por favor, insira seu email.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Por favor, insira um email válido.');
      return false;
    }
    if (!password) {
      setLocalError('Por favor, insira sua senha.');
      return false;
    }
    setLocalError('');
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <BarChart2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Controlaí</h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div>
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-5 w-5 mr-2"
            />
            Continuar com Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="block sm:inline">{localError}</span>
              </div>
              {localError.includes('confirme seu email') && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reenviar email de confirmação
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-10"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="Digite sua senha"
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
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-primary hover:text-primary-dark"
                onClick={() => setShowResetModal(true)}
              >
                Esqueceu sua senha?
              </button>
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
              'Entrar'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                Cadastre-se
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 sm:mx-0 sm:h-10 sm:w-10">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">Recuperar senha</h3>
                    
                    {resetSent ? (
                      <div className="mt-4">
                        <div className="flex items-center text-sm text-green-600 mb-4">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span>Email enviado com sucesso!</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Enviamos um email para <span className="font-medium">{resetEmail}</span> com instruções para redefinir sua senha.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-4">
                          Digite seu email e enviaremos um link para redefinir sua senha.
                        </p>
                        <form onSubmit={handleResetPassword}>
                          <input
                            type="email"
                            className="input w-full"
                            placeholder="Seu email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                          {localError && (
                            <p className="mt-2 text-sm text-red-600">{localError}</p>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {resetSent ? (
                  <button
                    type="button"
                    className="btn-primary sm:w-auto"
                    onClick={() => setShowResetModal(false)}
                  >
                    Fechar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-primary sm:ml-3 sm:w-auto"
                      onClick={handleResetPassword}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'Enviar link'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-outline mt-3 sm:mt-0 sm:w-auto"
                      onClick={() => setShowResetModal(false)}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;