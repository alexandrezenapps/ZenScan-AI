/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentMetadata } from './types';

export const RECENT_SCANS: DocumentMetadata[] = [
  {
    id: '1',
    name: 'Facture_Amazon_Avril.pdf',
    type: 'PDF',
    size: '1.2 MB',
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    tags: ['✨ AI Tagged', 'Finance'],
    isAiEnhanced: true,
    contentSnippet: "Facture d'achat pour un lot de matériel informatique. Total TTC: 450.00 EUR.",
    extractedData: {
      'Vendor': 'Amazon Europe Core S.a.r.l.',
      'Date': '15 Avril 2026',
      'Total Amount': '450.00 €',
      'Tax Amount': '75.00 €',
      'Invoice #': 'AMZ-2026-4491'
    }
  },
  {
    id: '2',
    name: 'Contrat_Bail_Residence.pdf',
    type: 'PDF',
    size: '2.4 MB',
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    tags: ['✨ AI Tagged', 'Legal'],
    isAiEnhanced: true,
    contentSnippet: "Contrat de location pour appartement T3. Durée 12 mois renouvelables.",
    extractedData: {
      'Loyer': '1 200 € HC',
      'Adresse': '42 Rue de la Paix',
      'Locataire': 'Alexandre Zen',
      'Bailleur': 'SCI Residence Zen',
      'Dépôt de garantie': '2 400 €'
    }
  },
  {
    id: '3',
    name: 'Passeport_Alexandre.jpg',
    type: 'JPG',
    size: '0.8 MB',
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: ['Identity'],
    isAiEnhanced: true,
    contentSnippet: "Document d'identité nationale. Valide jusqu'en 2032.",
    extractedData: {
      'Document Type': 'Passeport',
      'Nationality': 'Française',
      'Expiry Date': '12 Janvier 2032',
      'Date of Birth': '05 Mars 1995'
    }
  }
];

export const SMART_SUGGESTIONS = [
  {
    id: 'tax',
    title: 'Analyse Fiscale',
    description: '3 factures détectées',
    icon: 'ReceiptText',
  },
  {
    id: 'meeting',
    title: 'Résumé Intelligent',
    description: '1 contrat à synthétiser',
    icon: 'FileText',
  }
];

export const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'assistant' as const,
    content: "Bonjour Alexandre ! Je suis Zen AI. J'ai indexé vos derniers scans. Que souhaitez-vous faire ?",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
  },
  {
    id: '2',
    role: 'user' as const,
    content: "Peux-tu me résumer le contrat de bail ?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: "Bien sûr. C'est un bail de 12 mois pour le 42 Rue de la Paix. Le loyer est de 1 200 € HC, payable le 5 de chaque mois. La caution est de deux mois.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
  }
];
