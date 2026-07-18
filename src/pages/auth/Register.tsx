import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/use-page-title';

export default function Register() {
  usePageTitle(
    'Join Vuka Afrique | Sign Up Free',
    "Create your free account on Vuka Afrique. Whether you're a trainer or trainee, your skills journey starts here.",
  );

  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth/login', { replace: true });
  }, [navigate]);
  return null;
}
