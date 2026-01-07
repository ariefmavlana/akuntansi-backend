import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
  }

  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Convenience exports
export const hashPassword = (password: string) => PasswordUtil.hash(password);
export const comparePassword = (password: string, hashedPassword: string) =>
  PasswordUtil.compare(password, hashedPassword);
export const validatePasswordStrength = (password: string) => PasswordUtil.validateStrength(password);
