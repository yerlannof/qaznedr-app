import { User as NextAuthUser } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { getSecureAuthConfig } from '@/lib/auth/jwt-security';
import { ValidationSchemas } from '@/lib/middleware/input-validation';

interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  image: string | null;
}

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
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
      async authorize(credentials) {
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

        const supabase = await createClient();

        // Use parameterized query to prevent SQL injection
        const { data: user, error } = (await supabase
          .from('users')
          .select(
            'id, email, name, password, image, is_verified, failed_login_attempts, last_failed_login'
          )
          .eq('email', credentials.email.toLowerCase().trim())
          .single()) as {
          data:
            | (User & {
                is_verified?: boolean;
                failed_login_attempts?: number;
                last_failed_login?: string;
              })
            | null;
          error: any;
        };

        if (error || !user || !user.password) {
          // Log failed attempt (but don't specify what failed)
          console.warn(`Login attempt failed for email: ${credentials.email}`);
          throw new Error('Invalid credentials');
        }

        // Check if account is locked due to too many failed attempts
        if (user.failed_login_attempts && user.failed_login_attempts >= 5) {
          const lastFailedLogin = user.last_failed_login
            ? new Date(user.last_failed_login)
            : new Date(0);
          const lockoutExpiry = new Date(
            lastFailedLogin.getTime() + 15 * 60 * 1000
          ); // 15 minute lockout

          if (new Date() < lockoutExpiry) {
            console.warn(`Account locked for email: ${credentials.email}`);
            throw new Error(
              'Account temporarily locked due to too many failed attempts'
            );
          }
        }

        // Verify password with timing attack protection
        let isPasswordValid = false;
        try {
          isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
        } catch (error) {
          console.error('Password verification error:', error);
          isPasswordValid = false;
        }

        if (!isPasswordValid) {
          // Update failed login attempts
          const updateData = {
            failed_login_attempts: (user.failed_login_attempts || 0) + 1,
            last_failed_login: new Date().toISOString(),
          };
          await (supabase.from('users') as any)
            .update(updateData)
            .eq('id', user.id);

          console.warn(`Invalid password for email: ${credentials.email}`);
          throw new Error('Invalid credentials');
        }

        // Check if email is verified (if you have email verification)
        if (user.is_verified === false) {
          throw new Error('Please verify your email address before logging in');
        }

        // Reset failed login attempts on successful login
        if (user.failed_login_attempts && user.failed_login_attempts > 0) {
          const resetData = {
            failed_login_attempts: 0,
            last_failed_login: null,
            last_login: new Date().toISOString(),
          };
          await (supabase.from('users') as any)
            .update(resetData)
            .eq('id', user.id);
        }

        // Log successful login
        console.log(`Successful login for user: ${user.id}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
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
    }: {
      user: NextAuthUser | AdapterUser;
      account: { provider: string } | null;
    }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const supabase = await createServiceClient();
          const email = user.email.toLowerCase().trim();

          const { data: existing } = (await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()) as { data: { id: string } | null };

          let userId = existing?.id;

          if (!userId) {
            const placeholder = await bcrypt.hash(
              `oauth-${Date.now()}-${Math.random()}`,
              10
            );
            const { data: created } = (await (supabase as any)
              .from('users')
              .insert({
                email,
                name: user.name ?? null,
                image: user.image ?? null,
                password: placeholder,
                verified: true,
                email_verified: new Date().toISOString(),
              })
              .select('id')
              .single()) as { data: { id: string } | null };
            userId = created?.id;
          }

          if (userId) {
            user.id = userId;
            await (supabase as any).from('profiles').upsert(
              {
                id: userId,
                full_name: user.name || email.split('@')[0],
                email,
                avatar_url: user.image ?? null,
              },
              { onConflict: 'id' }
            );
          }
        } catch (err) {
          console.error('Google signIn provisioning failed:', err);
          return false;
        }
      }
      return true;
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
