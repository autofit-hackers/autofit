import { useState } from 'react';
import { signUp } from '../../lib/auth';

import { AuthStatus } from '../../types/auth';

export default function SignUp(setAuthState: (authState: AuthStatus) => void) {
  const [email, setEmail] = useState<string>('');
  const [temporalPassword, setTemporalPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handleTemporalPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setTemporalPassword(e.target.value);
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value);
  const handleSignUp = async () => {
    await signUp(email, temporalPassword, newPassword);
    setAuthState('sign-in');
  };

  return (
    <>
      <h1>Sign up</h1>
      <>
        <input type="text" placeholder="email" value={email} onChange={handleEmailChange} />
        <input
          type="text"
          placeholder="temporal password"
          value={temporalPassword}
          onChange={handleTemporalPasswordChange}
        />
        <input type="text" placeholder="new password" value={newPassword} onChange={handleNewPasswordChange} />
        <button
          type="submit"
          onClick={() => {
            void handleSignUp();
          }}
        >
          Sign up
        </button>
      </>
    </>
  );
}
