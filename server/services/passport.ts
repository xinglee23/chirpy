import passport, { Profile } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorHandler } from 'next-connect';
import { serialize } from 'cookie';

import { AUTH_COOKIE_NAME } from './constants';
import { createSecureToken } from '../utilities/auth';
import { redirect } from '../response';
import { prisma } from '../context';
import { getFirstQueryParam } from '../utilities/url';

interface User {
  id: string;
}

passport.serializeUser<User, string>((user, done) => {
  done(null, user.id);
});

passport.deserializeUser<User, string>((id, done) => {
  prisma.user
    .findUnique({
      where: {
        id,
      },
    })
    .then((user) => {
      done(null, user as User);
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
    });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      const user = await getUserByProviderProfile(profile, 'google');
      cb(undefined, user);
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
      // Get a user's email no matter it's public or not
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, cb: $TsFixMe) => {
      const user = await getUserByProviderProfile(profile, 'github');
      cb(null, user);
    },
  ),
);

async function getUserByProviderProfile(profile: Profile, provider: 'github' | 'google') {
  console.log(profile);
  if (!profile.emails?.length) {
    throw new Error(`Can't find a valid email`);
  }
  const email = profile.emails[0].value;
  const avatar = profile.photos?.[0].value;

  const providerKey = `${provider}UserId` as 'githubUserId' | 'googleUserId';

  // Find one by provider user id
  let existing = await prisma.user.findUnique({
    where: {
      [providerKey]: profile.id,
    },
  });
  // Otherwise find one with the same email and link them
  if (!existing) {
    existing = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existing) {
      await prisma.user.update({
        where: {
          id: existing.id,
        },
        data: {
          [providerKey]: profile.id,
        },
      });
    }
  }

  if (!existing) {
    existing = await prisma.user.create({
      data: {
        email,
        name: profile.displayName || (profile.username as string),
        [providerKey]: profile.id,
        avatar,
        type: 'FREE',
      },
    });
  }

  if (avatar && existing.avatar !== avatar) {
    await prisma.user.update({
      where: {
        id: existing.id,
      },
      data: {
        avatar,
      },
    });
  }

  return existing;
}

export { passport };

export async function handleSuccessfulLogin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const { id } = (req as $TsFixMe).user;
  const authToken = await createSecureToken({
    userId: id,
  });
  const authCookie = serialize(AUTH_COOKIE_NAME, authToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // A year
  });
  res.setHeader('Set-Cookie', [authCookie]);
  const redirectURL = getFirstQueryParam(req.query, 'redirectURL');
  redirect(res, redirectURL || '/');
}

export async function handleLogout(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const authCookie = serialize(AUTH_COOKIE_NAME, '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: -1,
  });

  res.setHeader('Set-Cookie', [authCookie]);
  const redirectURL = getFirstQueryParam(req.query, 'redirectURL');
  redirect(res, redirectURL || '/');
}

export const handleInternalLoginFailure: ErrorHandler<NextApiRequest, NextApiResponse> = (
  err,
  req,
  res,
) => {
  console.error(err);
  console.error(req.query);
  console.error(req.env);

  res.status(500).end('zoo error: ' + err.toString());
};