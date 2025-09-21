import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export type StorageBucket =
  | 'images'
  | 'documents'
  | 'avatars'
  | 'company-logos';

interface UploadOptions {
  bucket: StorageBucket;
  folder?: string;
  fileName?: string;
  contentType?: string;
}

interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export class StorageService {
  private supabase = createClient();

  /**
   * Upload a file to Supabase Storage
   */
  async upload(file: File, options: UploadOptions): Promise<UploadResult> {
    try {
      const { bucket, folder = '', fileName, contentType } = options;

      // Generate unique filename if not provided
      const ext = file.name.split('.').pop();
      const uniqueName = fileName || `${uuidv4()}.${ext}`;
      const path = folder ? `${folder}/${uniqueName}` : uniqueName;

      // Upload file
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType || file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from(bucket).getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (error) {
      return {
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult[]> {
    const uploads = files.map((file) => this.upload(file, options));
    return Promise.all(uploads);
  }

  /**
   * Delete a file from storage
   */
  async delete(bucket: StorageBucket, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.from(bucket).remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(
    bucket: StorageBucket,
    paths: string[]
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.from(bucket).remove(paths);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get signed URL for temporary access to private files
   */
  async getSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      return null;
    }
  }

  /**
   * List files in a bucket/folder
   */
  async list(bucket: StorageBucket, folder?: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return data;
    } catch (error) {
      return [];
    }
  }
}

export const storageService = new StorageService();
