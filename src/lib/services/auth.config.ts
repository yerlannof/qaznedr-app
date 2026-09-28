import { User as NextAuthUser } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getSecureAuthConfig } from '@/lib/auth/jwt-security';
import { ValidationSchemas } from '@/lib/middleware/input-validation';
import { verifyEnvAdmin, isEnvAdminEmail } from '@/lib/auth/env-admin';
import { provisionGoogleIdentity } from '@/lib/auth/marketplace-identity';

const googleEnabled = Boolean(
  process.env.MARKETPLACE_IDENTITY_ENABLED === 'true' &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions = {
  providers: [
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Validate input format
        try {
          ValidationSchemas.email.parse(credentials.email);
          // Don't validate password strength here - just check it exists
          if (
            credentials.password.length < 1 ||
            credentials.password.length > 128
          ) {
            throw new Error('Invalid password length');
          }
        } catch (validationError) {
          console.error('Credential validation failed:', validationError);
          throw new Error('Invalid credentials format');
        }

        // Owner/admin login from env — the legacy `users` table does not exist.
        const forwarded = req?.headers?.['x-forwarded-for'];
        const clientIp =
          (typeof forwarded === 'string'
            ? forwarded.split(',')[0]
            : ''
          ).trim() || 'unknown';
        const envAdmin = await verifyEnvAdmin(
          credentials.email,
          credentials.password,
          undefined,
          clientIp
        );
        if (envAdmin) return envAdmin;

        // Public password registration is closed; only the owner credential path exists.
        return null;
      },
    }),
  ],
  // Use secure JWT configuration
  ...getSecureAuthConfig(),
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: NextAuthUser | AdapterUser;
    }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.iat = Math.floor(Date.now() / 1000); // Issued at
        token.sub = user.id; // Subject (user ID)
      }

      // Security: Rotate token every 5 minutes
      const tokenAge =
        Math.floor(Date.now() / 1000) - ((token.iat as number) || 0);
      if (tokenAge > 5 * 60) {
        // 5 minutes
        token.iat = Math.floor(Date.now() / 1000);
      }

      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;

        // Add security info to session
        session.expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      }
      return session;
    },
    async signIn({
      user,
      account,
      profile,
    }: {
      user: NextAuthUser | AdapterUser;
      account: { provider: string; providerAccountId?: string } | null;
      profile?: { sub?: string; email?: string; email_verified?: unknown };
    }) {
      if (account?.provider === 'credentials') return true;
      if (
        account?.provider !== 'google' ||
        process.env.MARKETPLACE_IDENTITY_ENABLED !== 'true' ||
        !account.providerAccountId ||
        !profile?.sub ||
        profile.sub !== account.providerAccountId ||
        profile.email_verified !== true ||
        !profile.email ||
        !user.email ||
        profile.email.trim().toLowerCase() !==
          user.email.trim().toLowerCase() ||
        isEnvAdminEmail(profile.email)
      )
        return false;
      try {
        const identity = await provisionGoogleIdentity({
          subject: profile.sub,
          email: profile.email,
          name: user.name ?? null,
          image: user.image ?? null,
        });
        Object.assign(user, identity);
        return true;
      } catch {
        // Do not log provider claims or database conflict details.
        return false;
      }
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Ensure redirect URLs are safe
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }: { user: NextAuthUser | AdapterUser }) {
      console.log(`User signed in: ${user.id} (${user.email})`);
    },
    async signOut({ token }: { token?: JWT }) {
      console.log(`User signed out: ${token?.sub}`);
    },
    async createUser({ user }: { user: NextAuthUser }) {
      console.log(`New user created: ${user.id} (${user.email})`);
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  debug:
    process.env.NODE_ENV === 'development' &&
    process.env.NEXTAUTH_DEBUG === 'true',
};
