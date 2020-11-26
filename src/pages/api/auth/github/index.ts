import { NextApiRequest, NextApiResponse } from 'next';
import connect from 'next-connect';
import { handleInternalLoginFailure, passport } from '$server/services/passport';

const handler = connect<NextApiRequest, NextApiResponse>({
  onError: handleInternalLoginFailure,
});

handler.use(
  passport.initialize(),
  passport.authenticate('github', {
    scope: ['user:email'],
  }),
);

export default handler;
