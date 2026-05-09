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
  name: string;
  type: 'PDF' | 'JPG' | 'PNG';
  size: string;
  modifiedAt: Date;
  tags: string[];
  isAiEnhanced: boolean;
  contentSnippet?: string;
  extractedData?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
}

export type AppView = 'HOME' | 'LIBRARY' | 'SCANNER' | 'OCR' | 'EDITOR' | 'AI' | 'SETTINGS';
