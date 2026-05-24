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

export interface DetectedObject {
  name_en: string;
  name_fr: string;
  name_zh: string;
  boundingBox: [number, number, number, number];
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
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  detectedObjects?: DetectedObject[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis';
}

export enum AppView {
  HOME = 'HOME',
  LIBRARY = 'LIBRARY',
  SCANNER = 'SCANNER',
  OCR = 'OCR',
  EDITOR = 'EDITOR',
  AI = 'AI',
  SETTINGS = 'SETTINGS',
  ONBOARDING = 'ONBOARDING',
  SPLASH = 'SPLASH'
}
