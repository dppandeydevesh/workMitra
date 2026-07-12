import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast';
import { identifyUser, capture } from '../lib/posthog';
import { track, identify } from '../utils/analytics';
import {
  login,
  forgotPassword,
  verifyOtp,
  registerUser,
} from '../services/authService';

/**
 * useLoginPage — Hook to manage login/signup/forgot-password/OTP states and api pipeline flows.
 */
export function useLoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  // state
  const [view, setView] = useState('landing');
  const [userRole, setUserRole] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  // Password / strength / tokens / errors
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Loading States
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');
  const [sendingRecovery, setSendingRecovery] = useState(false);

  // check strength
  const checkPasswordStrength = (pass) => {
    setPassword(pass);
    if (!pass) {
      setPasswordStrength({ score: 0, text: '' });
      return;
    }

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    let text = t('login.passwordStrengthWeak') + ' ❌';
    if (score === 3)
      text =
        t('login.passwordStrengthMedium') +
        ' ⚠️ (' +
        t('login.addSpecialChars') +
        ')';
    if (score === 4)
      text =
        t('login.passwordStrengthStrong') + ' 🔥' + t('login.perfectStructure');

    setPasswordStrength({ score, text });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setErrorMessage('Please complete the security challenge verification.');
      return;
    }
    setErrorMessage('');
    setIsLoggingIn(true);
    try {
      const { ok, data } = await login(
        email,
        password,
        userRole,
        turnstileToken
      );

      if (ok) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.accessToken)
            localStorage.setItem('accessToken', data.accessToken);
          // Notify same-tab listeners (e.g. WebSocketProvider) since SPA navigation
          // doesn't reload the page and the "storage" event only fires in other tabs.
          window.dispatchEvent(new Event('auth:login'));
          identify(data.user._id, { role: data.user.userRole }); // PostHog identification
          track('user_logged_in', { role: data.user.userRole });

          if (data.user.userRole === 'company') {
            navigate('/company-dashboard');
          } else if (data.user.userRole === 'admin') {
            navigate('/admin-dashboard');
          } else if (data.user.userRole === 'college') {
            navigate('/college-dashboard');
          } else if (data.user.userRole === 'faculty') {
            navigate('/faculty-dashboard');
          } else {
            if (data.user.hasCompletedProfile === true) {
              navigate('/dashboard');
            } else {
              navigate('/preferences');
            }
          }
        }
      } else {
        setErrorMessage(data.error || t('login.invalidSignIn'));
      }
    } catch (err) {
      setErrorMessage(t('login.networkError', { message: err.message }));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setErrorMessage('Please complete the security challenge verification.');
      return;
    }
    if (passwordStrength.score < 4) {
      setErrorMessage(t('login.strongerPasswordRequired'));
      return;
    }
    const domainPart = email.toLowerCase().split('@')[1] || '';
    const looksAcademic =
      /\.(edu|ac)\b/.test(domainPart) ||
      /\.(org|res|ernet)\.in$/.test(domainPart);
    if ((userRole === 'student' || userRole === 'college') && !looksAcademic) {
      setErrorMessage(t('login.academicEmailRequired'));
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setErrorMessage('');
    setIsRegistering(true);

    let payload;
    if (userRole === 'company') {
      payload = {
        fullName: companyName,
        companyName,
        email,
        password,
        mobile,
        userRole: 'company',
        turnstileToken,
      };
    } else if (userRole === 'college') {
      payload = {
        fullName,
        email,
        password,
        mobile,
        collegeName,
        departmentName,
        userRole: 'college',
        turnstileToken,
      };
    } else {
      payload = {
        fullName,
        email,
        password,
        mobile,
        collegeName,
        enrollmentNumber,
        userRole: 'student',
        turnstileToken,
      };
    }

    try {
      const { ok, data } = await registerUser(payload);
      if (ok) {
        setIsOtpVerifying(true);
        setErrorMessage('');
        setEmailOtpInput('');
      } else {
        setErrorMessage(data.error || t('login.registrationSystemError'));
      }
    } catch (err) {
      setErrorMessage(t('login.registrationError', { message: err.message }));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleForgotPassword = () => {
    setView('forgot');
    setErrorMessage('');
    setRecoveryMessage('');
    setGeneratedResetLink('');
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setRecoveryMessage('');
    setSendingRecovery(true);

    try {
      const { ok, data } = await forgotPassword(recoveryEmail);
      if (ok) {
        setRecoveryMessage(t('login.resetInstructionsSent'));
        if (data.resetLink) {
          setGeneratedResetLink(data.resetLink);
        }
      } else {
        setErrorMessage(data.error || t('login.failedRecoveryLink'));
      }
    } catch (err) {
      setErrorMessage(
        t('login.otpVerificationError', { message: err.message })
      );
    } finally {
      setSendingRecovery(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsVerifying(true);

    try {
      const { ok, data } = await verifyOtp(email, emailOtpInput);
      if (ok) {
        toast.success(t('login.registrationSuccessful'));
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.accessToken)
          localStorage.setItem('accessToken', data.accessToken);
        // Same-tab notify so the WebSocket connects right after registration too.
        window.dispatchEvent(new Event('auth:login'));
        identifyUser();
        capture('user_registered', { role: data.user.userRole });

        // Reset registration fields
        setCompanyName('');
        setFullName('');
        setEmail('');
        setPassword('');
        setMobile('');
        setCollegeName('');
        setEnrollmentNumber('');
        setPasswordStrength({ score: 0, text: '' });
        setIsSignUp(false);
        setIsOtpVerifying(false);

        if (data.user.userRole === 'company') {
          navigate('/company-dashboard');
        } else if (data.user.userRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.user.userRole === 'college') {
          navigate('/college-dashboard');
        } else {
          navigate('/preferences');
        }
      } else {
        setErrorMessage(data.error || t('login.verificationFailed'));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('login.serverPortalError'));
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    view,
    setView,
    userRole,
    setUserRole,
    isSignUp,
    setIsSignUp,

    // field states
    email,
    setEmail,
    password,
    setPassword,
    mobile,
    setMobile,
    fullName,
    setFullName,
    companyName,
    setCompanyName,
    collegeName,
    setCollegeName,
    enrollmentNumber,
    setEnrollmentNumber,
    departmentName,
    setDepartmentName,

    // strength
    passwordStrength,
    setPasswordStrength,
    errorMessage,
    setErrorMessage,
    turnstileToken,
    setTurnstileToken,

    // loading state
    isRegistering,
    setIsRegistering,
    isLoggingIn,
    isVerifying,
    isOtpVerifying,
    setIsOtpVerifying,
    emailOtpInput,
    setEmailOtpInput,

    // recovery state
    recoveryEmail,
    setRecoveryEmail,
    recoveryMessage,
    generatedResetLink,
    sendingRecovery,

    // handlers
    checkPasswordStrength,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleForgotPassword,
    handleRecoverySubmit,
    handleOtpVerifySubmit,
  };
}
