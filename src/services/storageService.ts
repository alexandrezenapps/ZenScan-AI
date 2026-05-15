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
    const now = new Date().toISOString();
    
    const documentCopy = { 
      ...document, 
      modifiedAt: now,
      updatedAt: now,
      createdAt: document.createdAt instanceof Date 
        ? document.createdAt.toISOString() 
        : (document.createdAt || now)
    } as any;

    // 1. Save to Local Storage (IndexedDB) - Rapid access
    try {
      const ldb = await this.localDb;
      if (ldb) {
        await ldb.put(STORE_NAME, documentCopy);
      }
    } catch (err) {
      console.error("Local storage save failed:", err);
    }

    // 2. Save to Firestore (if enabled, online and authenticated) - Practical cloud sync
    if (userId && isCloudSyncEnabled) {
      const docPath = `users/${userId}/documents/${document.id}`;
      try {
        const docRef = doc(db, 'users', userId, 'documents', document.id);
        const firestoreDoc = {
           ...documentCopy,
           userId, // Ensure userId is set for rules
           updatedAt: serverTimestamp(),
           createdAt: document.createdAt ? new Date(document.createdAt) : serverTimestamp()
        };
        await setDoc(docRef, firestoreDoc, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }

    return this.normalizeDoc(documentCopy);
  }

  async updateDocument(docId: string, updates: Partial<DocumentMetadata>) {
    const ldb = await this.localDb;
    if (ldb) {
      try {
        const existing = await ldb.get(STORE_NAME, docId);
        if (existing) {
          const updated = { 
            ...existing, 
            ...updates, 
            updatedAt: new Date().toISOString(), 
            modifiedAt: new Date().toISOString() 
          };
          await this.saveDocument(this.normalizeDoc(updated));
        }
      } catch (err) {
        console.error("Local update failed:", err);
      }
    }
  }

  private normalizeDoc(data: any): DocumentMetadata {
    return {
      ...data,
      modifiedAt: data.modifiedAt ? new Date(data.modifiedAt) : new Date(),
      createdAt: data.createdAt?.toDate 
        ? data.createdAt.toDate() 
        : (data.createdAt ? new Date(data.createdAt) : new Date())
    };
  }

  async getDocuments(): Promise<DocumentMetadata[]> {
    const userId = auth.currentUser?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false';
    let docs: any[] = [];

    // 1. Always start with Local Storage for instant UI (Rapid)
    try {
      const ldb = await this.localDb;
      if (ldb) {
        docs = await ldb.getAll(STORE_NAME);
      }
    } catch (err) {
      console.error("Local storage read failed:", err);
    }

    // 2. If enabled and online, background sync from Firestore (Intuitive)
    if (userId && isCloudSyncEnabled && navigator.onLine) {
      const collectionPath = `users/${userId}/documents`;
      try {
        const q = query(collection(db, 'users', userId, 'documents'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const firestoreDocs = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
        
        if (firestoreDocs.length > 0) {
          const ldb = await this.localDb;
          if (ldb) {
            for (const fdoc of firestoreDocs) {
              const existingLocal = await ldb.get(STORE_NAME, fdoc.id);
              // Handle URL priority (local base64 vs cloud URL)
              if (existingLocal && existingLocal.url && !fdoc.url) {
                const mergedDoc = { ...fdoc, url: existingLocal.url };
                await ldb.put(STORE_NAME, mergedDoc);
              } else {
                await ldb.put(STORE_NAME, fdoc);
              }
            }
            // Refresh docs from local after sync
            const updatedLocalDocs = await ldb.getAll(STORE_NAME);
            docs = updatedLocalDocs;
          }
        }
      } catch (err) {
        console.warn("Firestore background sync failed:", err);
        // We don't throw here to allow app to function with local data
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
      const docPath = `users/${userId}/documents/${docId}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'documents', docId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    }
  }

  // Handle background sync when coming back online
  initOnlineSync() {
    window.addEventListener('online', async () => {
      console.log("[Storage] Online detected, triggering background sync...");
      const user = auth.currentUser;
      if (user) {
        await this.getDocuments();
        await this.syncUserProfile();
      }
    });
  }

  // Sync user profile for better management
  async syncUserProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const profilePath = `users/${user.uid}`;
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        cloudSyncEnabled: localStorage.getItem('zenScanCloudSync') !== 'false',
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  }
}

export const storageService = new StorageService();
storageService.initOnlineSync();

