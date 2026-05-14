import { openDB, IDBPDatabase } from 'idb';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { DocumentMetadata } from '../types';

const DB_NAME = 'ZenScanDB';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

class StorageService {
  private localDb: Promise<IDBPDatabase> | null = null;

  constructor() {
    this.initLocalDb();
  }

  private async initLocalDb() {
    if (typeof window === 'undefined') return;
    this.localDb = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async saveDocument(document: DocumentMetadata) {
    const userId = auth.currentUser?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false';
    const documentCopy = { 
      ...document, 
      modifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : (document.createdAt || new Date().toISOString())
    } as any;

    // 1. Save to Local Storage (IndexedDB)
    try {
      const ldb = await this.localDb;
      if (ldb) {
        await ldb.put(STORE_NAME, documentCopy);
      }
    } catch (err) {
      console.error("Local storage save failed:", err);
    }

    // 2. Save to Firestore (if enabled, online and authenticated)
    if (userId && isCloudSyncEnabled) {
      try {
        const docRef = doc(db, 'users', userId, 'documents', document.id);
        const firestoreDoc = {
           ...documentCopy,
           updatedAt: serverTimestamp(),
           createdAt: document.createdAt ? new Date(document.createdAt) : serverTimestamp()
        };
        await setDoc(docRef, firestoreDoc, { merge: true });
      } catch (err) {
        console.warn("Firestore sync failed, document remains in local storage:", err);
      }
    }

    return this.normalizeDoc(documentCopy);
  }

  async updateDocument(docId: string, updates: Partial<DocumentMetadata>) {
    const ldb = await this.localDb;
    if (ldb) {
      const existing = await ldb.get(STORE_NAME, docId);
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString(), modifiedAt: new Date().toISOString() };
        await this.saveDocument(this.normalizeDoc(updated));
      }
    }
  }

  private normalizeDoc(data: any): DocumentMetadata {
    return {
      ...data,
      modifiedAt: data.modifiedAt ? new Date(data.modifiedAt) : new Date(),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
    };
  }

  async getDocuments(): Promise<DocumentMetadata[]> {
    const userId = auth.currentUser?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false';
    let docs: any[] = [];

    // 1. Try to get from Local Storage first
    try {
      const ldb = await this.localDb;
      if (ldb) {
        docs = await ldb.getAll(STORE_NAME);
      }
    } catch (err) {
      console.error("Local storage read failed:", err);
    }

    // 2. If enabled and online, try to sync from Firestore
    if (userId && isCloudSyncEnabled && navigator.onLine) {
      try {
        const q = query(collection(db, 'users', userId, 'documents'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const firestoreDocs = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
        
        if (firestoreDocs.length > 0) {
          const ldb = await this.localDb;
          if (ldb) {
            for (const fdoc of firestoreDocs) {
              // Be careful: don't overwrite a local doc that has a URL if the cloud one doesn't
              // (which can happen if the URL was too big to sync to Firestore)
              const existingLocal = await ldb.get(STORE_NAME, fdoc.id);
              if (existingLocal && existingLocal.url && !fdoc.url) {
                const mergedDoc = { ...fdoc, url: existingLocal.url };
                await ldb.put(STORE_NAME, mergedDoc);
              } else {
                await ldb.put(STORE_NAME, fdoc);
              }
            }
          }
          // After syncing to local, we still return the merged or latest data
          const localDocs = await ldb?.getAll(STORE_NAME);
          if (localDocs) docs = localDocs;
          else docs = firestoreDocs;
        }
      } catch (err) {
        console.warn("Firestore sync failed, using local documents:", err);
      }
    }

    const uniqueDocs = Array.from(new Map(docs.map(d => [d.id, d])).values());
    return uniqueDocs.map(d => this.normalizeDoc(d)).sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  }

  async deleteDocument(docId: string) {
    const userId = auth.currentUser?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false';

    // 1. Delete from Local
    try {
      const ldb = await this.localDb;
      if (ldb) {
        await ldb.delete(STORE_NAME, docId);
      }
    } catch (err) {
      console.error("Local delete failed:", err);
    }

    // 2. Delete from Firestore
    if (userId && isCloudSyncEnabled) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'documents', docId));
      } catch (err) {
        console.warn("Firestore delete failed:", err);
      }
    }
  }
}

export const storageService = new StorageService();
