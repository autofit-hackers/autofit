import { useState } from 'react';
import { signIn } from '../../lib/auth';

import { AuthStatus } from '../../types/auth';

export default function SignUp(setAuthState: (authState: AuthStatus) => void) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const handleSignIn = async () => {
    await signIn(email, password);
    setAuthState('sign-in');
  };

  return (
    <>
      <h1>Sign In</h1>
      <>
        <input type="text" placeholder="email" value={email} onChange={handleEmailChange} />
        <input type="text" placeholder="password" value={password} onChange={handlePasswordChange} />
        <button
          type="submit"
          onClick={() => {
            void handleSignIn();
          }}
        >
          Sign In
        </button>
      </>
    </>
  );
}
