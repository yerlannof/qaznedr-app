import bcrypt from 'bcryptjs';
import { isEnvAdminEmail, verifyEnvAdmin } from '@/lib/auth/env-admin';

const hash = bcrypt.hashSync('correct horse', 4);
const env = { emails: 'Owner@Qaznedr.kz, second@x.kz', hash };

describe('env admin', () => {
  it('matches admin emails case-insensitively', () => {
    expect(isEnvAdminEmail('owner@qaznedr.kz', env.emails)).toBe(true);
    expect(isEnvAdminEmail('other@x.kz', env.emails)).toBe(false);
    expect(isEnvAdminEmail(null, env.emails)).toBe(false);
    expect(isEnvAdminEmail('owner@qaznedr.kz', '')).toBe(false);
  });

  it('returns the admin user for the right password', async () => {
    await expect(
      verifyEnvAdmin(' OWNER@qaznedr.kz ', 'correct horse', env)
    ).resolves.toEqual({
      id: 'env-admin:owner@qaznedr.kz',
      email: 'owner@qaznedr.kz',
      name: 'Admin',
      image: null,
    });
  });

  it('rejects a wrong password, a non-admin email or a missing hash', async () => {
    await expect(
      verifyEnvAdmin('owner@qaznedr.kz', 'nope', env)
    ).resolves.toBeNull();
    await expect(
      verifyEnvAdmin('x@x.kz', 'correct horse', env)
    ).resolves.toBeNull();
    await expect(
      verifyEnvAdmin('owner@qaznedr.kz', 'correct horse', {
        emails: env.emails,
      })
    ).resolves.toBeNull();
  });

  it('locks an email out after 10 attempts in 15 minutes', async () => {
    for (let i = 0; i < 10; i++)
      await verifyEnvAdmin('second@x.kz', 'bad', env);
    await expect(
      verifyEnvAdmin('second@x.kz', 'correct horse', env)
    ).resolves.toBeNull();
  });

  it('does not let one IP lock the owner out of another', async () => {
    for (let i = 0; i < 10; i++)
      await verifyEnvAdmin('owner@qaznedr.kz', 'bad', env, '10.0.0.1');
    await expect(
      verifyEnvAdmin('owner@qaznedr.kz', 'correct horse', env, '10.0.0.2')
    ).resolves.not.toBeNull();
  });

  it('spends a bcrypt compare on unknown emails too', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');
    await verifyEnvAdmin('stranger@x.kz', 'whatever', env, '10.0.0.3');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
