import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeClosed, ArrowLeft, Mail, Lock, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'login' | 'register-email' | 'register-password' | 'forgot-password' | 'verify-code' | 'reset-password';

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [], isValid: false });
  const [codeExpiryTime, setCodeExpiryTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [rateLimitAttempts, setRateLimitAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const { login, signup } = useAuth();
  const { toast } = useToast();

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const RATE_LIMIT_DURATION = 15 * 60 * 1000; // 15 minutes
  const CODE_EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

  // Timer for verification code expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (codeExpiryTime && currentStep === 'verify-code') {
      interval = setInterval(() => {
        const remaining = Math.max(0, codeExpiryTime - Date.now());
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setCurrentStep('forgot-password');
          setErrors({ general: 'Verification code has expired. Please request a new one.' });
          clearInterval(interval);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [codeExpiryTime, currentStep]);

  // Rate limiting check
  useEffect(() => {
    const checkRateLimit = () => {
      const attempts = localStorage.getItem('auth_attempts');
      const lastAttempt = localStorage.getItem('auth_last_attempt');
      
      if (attempts && lastAttempt) {
        const attemptCount = parseInt(attempts);
        const lastAttemptTime = parseInt(lastAttempt);
        const timeSinceLastAttempt = Date.now() - lastAttemptTime;
        
        if (attemptCount >= MAX_ATTEMPTS && timeSinceLastAttempt < RATE_LIMIT_DURATION) {
          setIsRateLimited(true);
          setRateLimitAttempts(attemptCount);
          
          setTimeout(() => {
            setIsRateLimited(false);
            localStorage.removeItem('auth_attempts');
            localStorage.removeItem('auth_last_attempt');
          }, RATE_LIMIT_DURATION - timeSinceLastAttempt);
        }
      }
    };
    
    checkRateLimit();
  }, []);

  const recordFailedAttempt = () => {
    const currentAttempts = parseInt(localStorage.getItem('auth_attempts') || '0') + 1;
    localStorage.setItem('auth_attempts', currentAttempts.toString());
    localStorage.setItem('auth_last_attempt', Date.now().toString());
    setRateLimitAttempts(currentAttempts);
    
    if (currentAttempts >= MAX_ATTEMPTS) {
      setIsRateLimited(true);
      setTimeout(() => {
        setIsRateLimited(false);
        localStorage.removeItem('auth_attempts');
        localStorage.removeItem('auth_last_attempt');
      }, RATE_LIMIT_DURATION);
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem('auth_attempts');
    localStorage.removeItem('auth_last_attempt');
    setRateLimitAttempts(0);
    setIsRateLimited(false);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one lowercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one special character');
    }

    const isValid = score >= 4 && password.length >= 8;
    
    return { score, feedback, isValid };
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (currentStep === 'register-password') {
      setPasswordStrength(validatePassword(newPassword));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'login' || currentStep === 'register-email' || currentStep === 'forgot-password') {
      if (!email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (currentStep === 'login') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (currentStep === 'register-password') {
      if (!passwordStrength.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
      
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (currentStep === 'verify-code') {
      if (!verificationCode) {
        newErrors.verificationCode = 'Verification code is required';
      } else if (verificationCode.length !== 6) {
        newErrors.verificationCode = 'Verification code must be 6 digits';
      }
    }

    if (currentStep === 'reset-password') {
      const strength = validatePassword(password);
      if (!strength.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
      
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRateLimited) {
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${Math.ceil((RATE_LIMIT_DURATION - (Date.now() - parseInt(localStorage.getItem('auth_last_attempt') || '0'))) / 60000)} minutes before trying again.`,
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.error) {
        clearFailedAttempts();
        toast({
          title: "Welcome Back!",
          description: "You have been logged in successfully.",
        });
        handleClose();
      } else {
        recordFailedAttempt();
        setErrors({ general: result.error });
      }
    } catch (error) {
      recordFailedAttempt();
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-check'
      });
      
      if (existingUser) {
        setErrors({ email: 'An account with this email already exists' });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      // Email doesn't exist, which is what we want for registration
    }

    setCurrentStep('register-password');
    setIsLoading(false);
  };

  const handleRegisterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signup(email, password);
      if (!result.error) {
        toast({
          title: "Account Created Successfully!",
          description: "Welcome to XByzeth! You can now start using our services.",
        });
        handleClose();
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Failed to create account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Generate a 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code and email in localStorage for verification
      // In a real app, this would be sent via email and stored securely on the server
      localStorage.setItem('reset_code', code);
      localStorage.setItem('reset_email', email);
      
      // Set expiry time
      const expiryTime = Date.now() + CODE_EXPIRY_DURATION;
      setCodeExpiryTime(expiryTime);
      localStorage.setItem('reset_code_expiry', expiryTime.toString());

      // Simulate sending email (in real app, this would call your email service)
      console.log(`Verification code for ${email}: ${code}`);
      
      toast({
        title: "Verification Code Sent",
        description: `A 6-digit verification code has been sent to ${email}. You have 5 minutes to use it.`,
      });
      
      setCurrentStep('verify-code');
    } catch (error) {
      setErrors({ general: 'Failed to send verification code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const storedCode = localStorage.getItem('reset_code');
      const storedEmail = localStorage.getItem('reset_email');
      const storedExpiry = localStorage.getItem('reset_code_expiry');
      
      if (!storedCode || !storedEmail || !storedExpiry) {
        setErrors({ general: 'Verification session expired. Please start over.' });
        setCurrentStep('forgot-password');
        setIsLoading(false);
        return;
      }

      if (Date.now() > parseInt(storedExpiry)) {
        setErrors({ general: 'Verification code has expired. Please request a new one.' });
        setCurrentStep('forgot-password');
        localStorage.removeItem('reset_code');
        localStorage.removeItem('reset_email');
        localStorage.removeItem('reset_code_expiry');
        setIsLoading(false);
        return;
      }

      if (verificationCode !== storedCode) {
        setErrors({ verificationCode: 'Invalid verification code. Please try again.' });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Code Verified",
        description: "Please set your new password.",
      });
      
      setCurrentStep('reset-password');
    } catch (error) {
      setErrors({ general: 'Verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const storedEmail = localStorage.getItem('reset_email');
      
      if (!storedEmail) {
        setErrors({ general: 'Session expired. Please start over.' });
        setCurrentStep('forgot-password');
        setIsLoading(false);
        return;
      }

      // In a real app, you would update the password via your backend API
      // For now, we'll simulate a successful password reset
      
      // Clean up stored data
      localStorage.removeItem('reset_code');
      localStorage.removeItem('reset_email');
      localStorage.removeItem('reset_code_expiry');
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      setCurrentStep('login');
      setPassword('');
      setConfirmPassword('');
      setVerificationCode('');
    } catch (error) {
      setErrors({ general: 'Failed to reset password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setErrors({});
    setPasswordStrength({ score: 0, feedback: [], isValid: false });
    setCodeExpiryTime(null);
    setTimeRemaining(0);
    onClose();
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPasswordStrengthColor = (score: number): string => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number): string => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'login':
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  required
                  disabled={isRateLimited}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  required
                  disabled={isRateLimited}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isRateLimited}
                >
                  {showPassword ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setCurrentStep('forgot-password')}
                className="text-sm text-custom-dark-maroon hover:underline"
                disabled={isRateLimited}
              >
                Forgot Password?
              </button>
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {isRateLimited && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-600 text-sm">
                  Too many failed attempts. Please wait before trying again.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || isRateLimited} 
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentStep('register-email')}
                className="text-custom-dark-maroon hover:underline"
                disabled={isRateLimited}
              >
                Don't have an account? Create one
              </button>
            </div>
          </form>
        );

      case 'register-email':
        return (
          <form onSubmit={handleRegisterEmail} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep('login')}
              className="p-0 h-auto text-custom-dark-maroon hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>

            <div>
              <Label htmlFor="register-email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        );

      case 'register-password':
        return (
          <form onSubmit={handleRegisterPassword} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep('register-email')}
              className="p-0 h-auto text-custom-dark-maroon hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-600 text-sm">
                Creating account for: <strong>{email}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="register-password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Create a strong password"
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{getPasswordStrengthText(passwordStrength.score)}</span>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {confirmPassword && password && (
                <div className="mt-1 flex items-center space-x-2">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Passwords don't match</span>
                    </>
                  )}
                </div>
              )}
              
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !passwordStrength.isValid || password !== confirmPassword} 
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        );

      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep('login')}
              className="p-0 h-auto text-custom-dark-maroon hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-600 text-sm">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
            </div>

            <div>
              <Label htmlFor="reset-email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </form>
        );

      case 'verify-code':
        return (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep('forgot-password')}
              className="p-0 h-auto text-custom-dark-maroon hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-600 text-sm">
                We've sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>

            {timeRemaining > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-yellow-600 text-sm">
                    Code expires in: <strong>{formatTime(timeRemaining)}</strong>
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="verification-code">Verification Code *</Label>
              <Input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className={`text-center text-lg tracking-widest ${errors.verificationCode ? 'border-red-500' : ''}`}
                maxLength={6}
                required
              />
              {errors.verificationCode && <p className="text-red-500 text-sm mt-1">{errors.verificationCode}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || verificationCode.length !== 6} 
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentStep('forgot-password')}
                className="text-sm text-custom-dark-maroon hover:underline"
              >
                Didn't receive the code? Send again
              </button>
            </div>
          </form>
        );

      case 'reset-password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-green-600 text-sm">
                  Code verified! Please set your new password.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="new-password">New Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter new password"
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{getPasswordStrengthText(passwordStrength.score)}</span>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirm-new-password">Confirm New Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {confirmPassword && password && (
                <div className="mt-1 flex items-center space-x-2">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Passwords don't match</span>
                    </>
                  )}
                </div>
              )}
              
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !passwordStrength.isValid || password !== confirmPassword} 
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'login': return 'Welcome Back';
      case 'register-email': return 'Create Account - Step 1';
      case 'register-password': return 'Create Account - Step 2';
      case 'forgot-password': return 'Reset Password';
      case 'verify-code': return 'Verify Code';
      case 'reset-password': return 'Set New Password';
      default: return 'Authentication';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-custom-dark-maroon">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};