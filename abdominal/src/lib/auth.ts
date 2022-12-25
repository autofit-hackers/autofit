import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

import { panic } from './panic';
import assertIsDefined from './type-guards';

type NodeResult<T> = [Error, null] | [null, T];

/**
 * セッションストレージにアカウント情報を保存
 * - ページのリロード、短時間の間でのタブの復元 (Ctrl + Shift + T) でのみログイン状態が保持される
 * - 新しいタブで開くか新しいブラウザで開く場合はログアウト
 */

const storage = window.sessionStorage;

const cognitoUserPool = new CognitoUserPool({
  UserPoolId: 'us-west-2_gTsMf2x1A',
  ClientId: '6b9h1csmn8l10ifbpljjs4l5g4',
  Storage: storage,
});

let cognitoUser: CognitoUser | null;

export async function getSession(): Promise<CognitoUserSession> {
  const [error, session] = await new Promise<NodeResult<CognitoUserSession>>((resolve) => {
    assertIsDefined(cognitoUser);
    cognitoUser.getSession((...args: NodeResult<CognitoUserSession>) => resolve(args));
  });

  if (error) {
    throw error;
  }

  return session;
}

export async function isSignedIn(): Promise<boolean> {
  cognitoUser ??= cognitoUserPool.getCurrentUser();

  if (cognitoUser == null) {
    return false;
  }

  return getSession().then(
    () => true,
    () => false,
  );
}

export async function getEmail(): Promise<string> {
  const [error, attributes] = await new Promise<NodeResult<CognitoUserAttribute[]>>((resolve) => {
    assertIsDefined(cognitoUser);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cognitoUser.getUserAttributes((...args: NodeResult<CognitoUserAttribute[]>) => resolve(args)); // 公式の型付けが不適切
  });

  if (error) {
    throw error;
  }

  const emailAttribute = attributes.find((attribute) => attribute.getName() === 'email');

  return emailAttribute?.getValue() ?? '';
}

export async function signUp(email: string, temporalPassword: string, newPassword: string): Promise<void> {
  cognitoUser = new CognitoUser({
    Username: email,
    Pool: cognitoUserPool,
    Storage: storage,
  });

  const details = new AuthenticationDetails({
    Username: email,
    Password: temporalPassword,
  });

  const [signInError] = await new Promise<NodeResult<null>>((resolve) => {
    assertIsDefined(cognitoUser);

    cognitoUser.authenticateUser(details, {
      newPasswordRequired: () => resolve([null, null]),
      onFailure: (error) => resolve([error, null]),
      onSuccess: () => panic('unreachable'),
    });
  });

  if (signInError) {
    throw signInError;
  }

  const [passwordChangeError] = await new Promise<NodeResult<null>>((resolve) => {
    assertIsDefined(cognitoUser);

    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      { email },
      {
        mfaRequired: () => resolve([null, null]),
        onFailure: (error) => resolve([error, null]),
        onSuccess: () => panic('unreachable'),
      },
    );
  });

  if (passwordChangeError) {
    throw passwordChangeError;
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  cognitoUser = new CognitoUser({
    Username: email,
    Pool: cognitoUserPool,
    Storage: storage,
  });

  const details = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const [error] = await new Promise<NodeResult<null>>((resolve) => {
    assertIsDefined(cognitoUser);

    cognitoUser.authenticateUser(details, {
      mfaRequired: () => resolve([null, null]),
      onFailure: (e) => resolve([e, null]),
      onSuccess: () => panic('unreachable'),
    });
  });

  if (error) {
    throw error;
  }
}

export async function confirmSignIn(mfaCode: string): Promise<CognitoUserSession> {
  const [error, session] = await new Promise<NodeResult<CognitoUserSession>>((resolve) => {
    assertIsDefined(cognitoUser);

    cognitoUser.sendMFACode(mfaCode, {
      onSuccess: (s) => resolve([null, s]),
      onFailure: (e) => resolve([e, null]),
    });
  });

  if (error) {
    throw error;
  }

  return session;
}

export async function forgotPassword(email: string): Promise<unknown> {
  cognitoUser = new CognitoUser({
    Username: email,
    Pool: cognitoUserPool,
    Storage: storage,
  });

  const [error, data] = await new Promise<NodeResult<unknown>>((resolve) => {
    assertIsDefined(cognitoUser);
    cognitoUser.forgotPassword({
      onSuccess: (d) => resolve([null, d]),
      onFailure: (e) => resolve([e, null]),
    });
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function confirmPassword(verificationCode: string, newPassword: string): Promise<void> {
  const [error] = await new Promise<NodeResult<null>>((resolve) => {
    assertIsDefined(cognitoUser);

    cognitoUser.confirmPassword(verificationCode, newPassword, {
      // 変数 success は常に 'SUCCESS' という文字列のため不要
      onSuccess: (_) => resolve([null, null]),
      onFailure: (e) => resolve([e, null]),
    });
  });

  if (error) {
    throw error;
  }
}

export function signOut(): Promise<void> {
  return new Promise<void>((resolve) => {
    assertIsDefined(cognitoUser);

    cognitoUser.signOut(resolve);
  });
}
