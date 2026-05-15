/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface DocumentMetadata {
  id: string;
  userId?: string;
  name: string;
  type: 'PDF' | 'JPG' | 'PNG';
  category?: string;
  size: string;
  modifiedAt: Date;
  createdAt?: Date;
  tags: string[];
  isAiEnhanced: boolean;
  contentSnippet?: string;
  extractedData?: Record<string, any>;
  url?: string;
  thumbnailUrl?: string;
  ocrLanguage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
}

export type AppView = 'HOME' | 'LIBRARY' | 'SCANNER' | 'OCR' | 'EDITOR' | 'AI' | 'SETTINGS' | 'ONBOARDING' | 'SPLASH';
