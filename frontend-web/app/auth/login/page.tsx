'use client';

import { GoogleLogin } from '@react-oauth/google';
import { signInWithGoogle } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const data = await signInWithGoogle(credentialResponse.credential);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      if (data.needs_profile_setup) router.push('/profile/setup');
      else if (data.needs_family_setup) router.push('/family/select');
      else router.push('/');
    } catch (e) {
      console.error(e);
      alert('Error al iniciar sesión con Google');
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h1>Finanzas Familiares</h1>
      <GoogleLogin onSuccess={handleSuccess} onError={() => console.log('Login Failed')} />
    </main>
  );
}
