import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth/login?panel=register', { replace: true });
  }, [navigate]);
  return null;
}
