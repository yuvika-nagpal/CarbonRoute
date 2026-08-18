import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'carbonroute_super_secure_jwt_production_secret_2026_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Storage Configuration
  storageType: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3',
  localStorageDir: process.env.LOCAL_STORAGE_DIR || path.resolve(__dirname, '../../uploads'),
  
  // S3 / Compatible Object Storage (AWS S3, MinIO, Cloudflare R2)
  s3: {
    endpoint: process.env.AWS_ENDPOINT || undefined,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.AWS_BUCKET_NAME || 'carbonroute-presentations',
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
  },

  // Admin Credentials Default for Initial Setup
  initialAdmin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@carbonroute.org',
    password: process.env.ADMIN_PASSWORD || 'CarbonRoute2026!Secure',
  }
};
