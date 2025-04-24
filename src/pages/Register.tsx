import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, Mail, Lock, User, Eye, EyeOff, AlertCircle, Check, X, Info, CheckCircle } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { useAuth } from '../contexts/AuthContext';

interface PasswordRequirement {
  id: string;
  text: string;
  met: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { id: 'length', text: 'Pelo menos 8 caracteres', met: false },
    { id: 'lowercase', text: 'Pelo menos 1 letra minúscula', met: false },
    { id: 'uppercase', text: 'Pelo menos 1 letra maiúscula', met: false },
    { id: 'number', text: 'Pelo menos 1 número', met: false },
    { id: 'special', text: 'Pelo menos 1 caractere especial', met: false }
  ]);
  
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, error, clearError, user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearError();
    };
  }, [user, navigate, clearError]);

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      const result = zxcvbn(password);
      setPasswordStrength(result);
      
      // Update password requirements
      setPasswordRequirements([
        { id: 'length', text: 'Pelo menos 8 caracteres', met: password.length >= 8 },
        { id: 'lowercase', text: 'Pelo menos 1 letra minúscula', met: /[a-z]/.test(password) },
        { id: 'uppercase', text: 'Pelo menos 1 letra maiúscula', met: /[A-Z]/.test(password) },
        { id: 'number', text: 'Pelo menos 1 número', met: /\d/.test(password) },
        { id: 'special', text: 'Pelo menos 1 caractere especial', met: /[^A-Za-z0-9]/.test(password) }
      ]);
    } else {
      setPasswordStrength(null);
      setPasswordRequirements(prev => prev.map(req => ({ ...req, met: false })));
    }
  }, [password]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Digite seu nome completo (nome e sobrenome)';
    }

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else {
      // Check if all password requirements are met
      const allRequirementsMet = passwordRequirements.every(req => req.met);
      if (!allRequirementsMet) {
        newErrors.password = 'A senha não atende aos requisitos de segurança';
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Você deve aceitar os termos e condições';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signUp(email, password, {
        data: {
          full_name: fullName,
        }
      });
      
      // Show success state instead of redirecting immediately
      setRegistrationSuccess(true);

      // Clear form
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAcceptTerms(false);
      
      // Redirect after a delay or wait for user to click "Continue to login"
      timeoutRef.current = setTimeout(() => {
        navigate('/login');
      }, 5000); // 5 seconds
      
    } catch (error: any) {
      // Error is handled by the auth context, but we'll set loading to false
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      // The redirect will be handled by Supabase OAuth
    } catch (err) {
      console.error('Google signup error:', err);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const getPasswordStrengthText = (score: number) => {
    switch (score) {
      case 0: return 'Muito fraca';
      case 1: return 'Fraca';
      case 2: return 'Média';
      case 3: return 'Forte';
      case 4: return 'Muito forte';
      default: return '';
    }
  };

  // If registration is successful, show success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Cadastro realizado!</h2>
          <p className="text-gray-600 mt-2">
            Um email de confirmação foi enviado para <span className="font-medium">{email}</span>.
            Por favor, verifique sua caixa de entrada e confirme seu cadastro.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="btn-primary w-full flex justify-center items-center"
              onClick={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
              }}
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <BarChart2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-sm text-gray-600">
            Cadastre-se para acessar o sistema
          </p>
        </div>

        {/* Google Sign-Up Button */}
        <div>
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={handleGoogleSignUp}
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
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className={`input pl-10 ${errors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Digite seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
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
                  className={`input pl-10 ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
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
                  autoComplete="new-password"
                  required
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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

              {/* Password requirements */}
              {(passwordFocused || password) && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Requisitos de senha:
                  </div>
                  <ul className="space-y-1">
                    {passwordRequirements.map((requirement) => (
                      <li key={requirement.id} className="flex items-start">
                        {requirement.met ? (
                          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${
                          requirement.met ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {requirement.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {passwordStrength && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Força da senha: <span className="font-medium">{getPasswordStrengthText(passwordStrength.score)}</span>
                      </div>
                      <div className="flex space-x-1">
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className={`h-2 w-1/4 rounded-full ${
                              index <= (passwordStrength?.score || -1)
                                ? getPasswordStrengthColor(passwordStrength?.score || 0)
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
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
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Confirme sua senha"
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
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className={`font-medium ${errors.terms ? 'text-red-700' : 'text-gray-700'}`}>
                  Eu aceito os{' '}
                  <a href="#" className="text-primary hover:text-primary-dark">
                    termos e condições
                  </a>
                </label>
              </div>
            </div>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
            )}
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
              'Criar conta'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                Faça login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;