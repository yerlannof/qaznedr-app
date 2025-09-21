import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { checkAuthRateLimit } from '@/lib/middleware/input-sanitization';

/**
 * Enhanced Authentication Service for Kazakhstan Mining Platform
 * Implements secure authentication, session management, and RBAC
 */

// User roles in the platform
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VERIFIED_SELLER = 'verified_seller',
  SELLER = 'seller',
  BUYER = 'buyer',
  GUEST = 'guest',
}

// Permission levels
export enum Permission {
  // Listing permissions
  CREATE_LISTING = 'create_listing',
  EDIT_OWN_LISTING = 'edit_own_listing',
  EDIT_ANY_LISTING = 'edit_any_listing',
  DELETE_OWN_LISTING = 'delete_own_listing',
  DELETE_ANY_LISTING = 'delete_any_listing',
  APPROVE_LISTING = 'approve_listing',
  
  // User permissions
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  BAN_USERS = 'ban_users',
  
  // System permissions
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data',
}

// Role-permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.CREATE_LISTING,
    Permission.EDIT_OWN_LISTING,
    Permission.EDIT_ANY_LISTING,
    Permission.DELETE_OWN_LISTING,
    Permission.DELETE_ANY_LISTING,
    Permission.APPROVE_LISTING,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.BAN_USERS,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS,
    Permission.EXPORT_DATA,
  ],
  [UserRole.MODERATOR]: [
    Permission.CREATE_LISTING,
    Permission.EDIT_OWN_LISTING,
    Permission.DELETE_OWN_LISTING,
    Permission.APPROVE_LISTING,
    Permission.VIEW_USERS,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.VERIFIED_SELLER]: [
    Permission.CREATE_LISTING,
    Permission.EDIT_OWN_LISTING,
    Permission.DELETE_OWN_LISTING,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.SELLER]: [
    Permission.CREATE_LISTING,
    Permission.EDIT_OWN_LISTING,
    Permission.DELETE_OWN_LISTING,
  ],
  [UserRole.BUYER]: [],
  [UserRole.GUEST]: [],
};

// Session configuration
const SESSION_CONFIG = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  refreshThreshold: 24 * 60 * 60 * 1000, // Refresh if less than 1 day left
  cookieName: 'qaznedr_session',
  secureCookieName: 'qaznedr_secure_session',
};

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  metadata?: Record<string, any>;
}

/**
 * Authentication Service Class
 */
export class AuthService {
  /**
   * Authenticate user and create session
   */
  static async authenticate(
    email: string,
    password: string,
    request: NextRequest
  ): Promise<{ success: boolean; user?: AuthenticatedUser; error?: string }> {
    try {
      // Check rate limiting for authentication attempts
      const ipAddress = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
      
      if (!checkAuthRateLimit(ipAddress)) {
        return {
          success: false,
          error: 'Too many authentication attempts. Please try again later.',
        };
      }

      const supabase = await createClient();

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        // Log failed attempt
        await this.logAuthAttempt(email, false, ipAddress);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Get user role and metadata
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, verified, banned, metadata')
        .eq('user_id', data.user.id)
        .single();

      // Check if user is banned
      if (profile?.banned) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Account has been suspended. Please contact support.',
        };
      }

      const userRole = (profile?.role as UserRole) || UserRole.BUYER;
      const permissions = rolePermissions[userRole] || [];

      // Create session
      const session = await this.createSession(
        data.user.id,
        data.user.email!,
        userRole,
        request
      );

      // Log successful authentication
      await this.logAuthAttempt(email, true, ipAddress);

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: userRole,
          permissions,
          metadata: profile?.metadata,
        },
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }
  }

  /**
   * Create secure session
   */
  static async createSession(
    userId: string,
    email: string,
    role: UserRole,
    request: NextRequest
  ): Promise<UserSession> {
    const supabase = await createClient();
    
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.maxAge);
    
    const session: UserSession = {
      userId,
      email,
      role,
      permissions: rolePermissions[role] || [],
      sessionId,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Store session in database
    await supabase
      .from('user_sessions')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        role,
        expires_at: expiresAt.toISOString(),
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        created_at: now.toISOString(),
        last_activity: now.toISOString(),
      }]);

    // Set secure session cookie
    const cookieStore = cookies();
    const sessionToken = this.generateSessionToken(session);
    
    cookieStore.set(SESSION_CONFIG.cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_CONFIG.maxAge / 1000, // Convert to seconds
      path: '/',
    });

    return session;
  }

  /**
   * Validate session
   */
  static async validateSession(
    request: NextRequest
  ): Promise<{ valid: boolean; user?: AuthenticatedUser; session?: UserSession }> {
    try {
      const cookieStore = cookies();
      const sessionToken = cookieStore.get(SESSION_CONFIG.cookieName)?.value;

      if (!sessionToken) {
        return { valid: false };
      }

      // Verify session token
      const session = this.verifySessionToken(sessionToken);
      if (!session) {
        return { valid: false };
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.destroySession(session.sessionId);
        return { valid: false };
      }

      const supabase = await createClient();

      // Validate session in database
      const { data: dbSession } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', session.sessionId)
        .eq('user_id', session.userId)
        .single();

      if (!dbSession || new Date(dbSession.expires_at) < new Date()) {
        await this.destroySession(session.sessionId);
        return { valid: false };
      }

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', session.sessionId);

      // Check if session needs refresh
      const timeLeft = new Date(session.expiresAt).getTime() - Date.now();
      if (timeLeft < SESSION_CONFIG.refreshThreshold) {
        await this.refreshSession(session.sessionId);
      }

      return {
        valid: true,
        user: {
          id: session.userId,
          email: session.email,
          role: session.role,
          permissions: session.permissions,
        },
        session,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Check if user has permission
   */
  static hasPermission(
    user: AuthenticatedUser,
    permission: Permission
  ): boolean {
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has role
   */
  static hasRole(user: AuthenticatedUser, role: UserRole): boolean {
    return user.role === role;
  }

  /**
   * Check if user has any of the roles
   */
  static hasAnyRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
    return roles.includes(user.role);
  }

  /**
   * Refresh session
   */
  static async refreshSession(sessionId: string): Promise<void> {
    const supabase = await createClient();
    const newExpiresAt = new Date(Date.now() + SESSION_CONFIG.maxAge);

    await supabase
      .from('user_sessions')
      .update({
        expires_at: newExpiresAt.toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
  }

  /**
   * Destroy session
   */
  static async destroySession(sessionId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId);

    const cookieStore = cookies();
    cookieStore.delete(SESSION_CONFIG.cookieName);
  }

  /**
   * Sign out user
   */
  static async signOut(request: NextRequest): Promise<void> {
    const { session } = await this.validateSession(request);
    
    if (session) {
      await this.destroySession(session.sessionId);
    }

    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  /**
   * Log authentication attempt
   */
  private static async logAuthAttempt(
    email: string,
    success: boolean,
    ipAddress: string
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('auth_logs')
        .insert([{
          email,
          success,
          ip_address: ipAddress,
          timestamp: new Date().toISOString(),
        }]);
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate session token
   */
  private static generateSessionToken(session: UserSession): string {
    const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
    
    return jwt.sign(
      {
        sessionId: session.sessionId,
        userId: session.userId,
        email: session.email,
        role: session.role,
        permissions: session.permissions,
        expiresAt: session.expiresAt,
      },
      secret,
      {
        expiresIn: '7d',
      }
    );
  }

  /**
   * Verify session token
   */
  private static verifySessionToken(token: string): UserSession | null {
    try {
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const decoded = jwt.verify(token, secret) as any;
      
      return {
        sessionId: decoded.sessionId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
        createdAt: new Date(),
        expiresAt: new Date(decoded.expiresAt),
        lastActivity: new Date(),
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
}

/**
 * Authorization middleware
 */
export function requireAuth(
  requiredPermissions?: Permission[],
  requiredRoles?: UserRole[]
) {
  return async function (
    request: NextRequest
  ): Promise<NextResponse | null> {
    const { valid, user } = await AuthService.validateSession(request);

    if (!valid || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        AuthService.hasPermission(user, permission)
      );

      if (!hasAllPermissions) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      if (!AuthService.hasAnyRole(user, requiredRoles)) {
        return NextResponse.json(
          { error: 'Insufficient role privileges' },
          { status: 403 }
        );
      }
    }

    return null; // Continue to next middleware
  };
}

// Export for use in API routes
export default AuthService;