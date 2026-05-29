import { openDB, IDBPDatabase } from 'idb';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { DocumentMetadata } from '../types';
import { RECENT_SCANS } from '../constants';

const DB_NAME = 'ZenScanDB';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

export interface SyncStatus {
  state: 'synced' | 'syncing' | 'pending' | 'offline' | 'error' | 'disabled';
  progress: number; // 0 to 100
  totalFiles: number;
  syncedFiles: number;
  lastSyncedAt: string | null;
  errorMessage?: string;
  syncedCount: number;
  localCount: number;
}

class StorageService {
  private localDb: Promise<IDBPDatabase> | null = null;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private currentSyncStatus: SyncStatus = {
    state: 'synced',
    progress: 100,
    totalFiles: 0,
    syncedFiles: 0,
    lastSyncedAt: localStorage.getItem('zenScanLastSyncedAt') || null,
    syncedCount: 0,
    localCount: 0
  };
  private activeSyncPromise: Promise<void> | null = null;

  private getCurrentUser() {
    if (auth.currentUser) return auth.currentUser;
    const stored = localStorage.getItem('zenScanLocalGuestUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  constructor() {
    this.initLocalDb().then(() => {
      this.calculateSyncRatios();
    }).catch(err => console.error("[Storage] Init calculate sync failed:", err));
    this.initAuthAndOnlineListeners();
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
    await this.localDb;
  }

  async calculateSyncRatios() {
    try {
      const ldb = await this.localDb;
      if (!ldb) return;
      const localDocs = await ldb.getAll(STORE_NAME);
      const total = localDocs.length;
      
      // If no docs exist, everything is in sync implicitly or default seed handles it
      // Standard docs seeded start synced or not synced based on database seed.
      // Let's count how many have isSynced === true
      const synced = localDocs.filter(d => d.isSynced === true).length;
      
      this.updateSyncStatus({
        localCount: total,
        syncedCount: synced
      });
    } catch (err) {
      console.error("[Storage] Failed to compute sync ratios:", err);
    }
  }

  private initAuthAndOnlineListeners() {
    if (typeof window === 'undefined') return;
    
    // Auto sync when user authentication changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.sync().catch(err => console.error("[Storage] Auto auth sync failed:", err));
      } else {
        this.updateSyncStatus({
          state: 'pending',
          progress: 0,
          totalFiles: 0,
          syncedFiles: 0
        });
      }
    });

    // Handle online network recovery
    window.addEventListener('online', () => {
      console.log("[Storage] Online detected, triggering sync...");
      this.sync().catch(err => console.error("[Storage] Online recovery sync failed:", err));
    });

    window.addEventListener('offline', () => {
      this.updateSyncStatus({ state: 'offline' });
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('zen-scan-guest-auth-changed', () => {
        this.sync().catch(err => console.error("[Storage] Guest status update sync failed:", err));
      });
    }
  }

  subscribeSyncStatus(listener: (status: SyncStatus) => void) {
    this.syncListeners.add(listener);
    listener(this.currentSyncStatus);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.currentSyncStatus = { ...this.currentSyncStatus, ...updates };
    if (updates.lastSyncedAt !== undefined) {
      if (updates.lastSyncedAt) {
        localStorage.setItem('zenScanLastSyncedAt', updates.lastSyncedAt);
      } else {
        localStorage.removeItem('zenScanLastSyncedAt');
      }
    }
    this.syncListeners.forEach(listener => listener(this.currentSyncStatus));
  }

  getSyncStatus(): SyncStatus {
    return this.currentSyncStatus;
  }

  setCloudSync(enabled: boolean) {
    localStorage.setItem('zenScanCloudSync', enabled ? 'true' : 'false');
    this.syncUserProfile().catch(err => console.error(err));
    this.sync().catch(err => console.error(err));
  }

  async sync(): Promise<void> {
    const user = this.getCurrentUser();
    const userId = user?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false' && !(userId && userId.startsWith('guest_'));

    if (!userId) {
      this.updateSyncStatus({ state: 'pending', errorMessage: 'Veuillez vous connecter pour activer la synchronisation.' });
      return;
    }

    if (userId.startsWith('guest_')) {
      this.updateSyncStatus({ state: 'disabled' });
      return;
    }

    if (!isCloudSyncEnabled) {
      this.updateSyncStatus({ state: 'disabled' });
      return;
    }

    if (!navigator.onLine) {
      this.updateSyncStatus({ state: 'offline' });
      return;
    }

    if (this.activeSyncPromise) {
      return this.activeSyncPromise;
    }

    this.activeSyncPromise = this.executeSync(userId);
    try {
      await this.activeSyncPromise;
    } finally {
      this.activeSyncPromise = null;
    }
  }

  private async executeSync(userId: string): Promise<void> {
    this.updateSyncStatus({
      state: 'syncing',
      progress: 0,
      totalFiles: 0,
      syncedFiles: 0,
      errorMessage: undefined
    });

    try {
      const ldb = await this.localDb;
      if (!ldb) {
        throw new Error("Base de données locale non initialisée");
      }

      // 1. Fetch Firestore Documents
      const collectionRef = collection(db, 'users', userId, 'documents');
      const qSnapshot = await getDocs(collectionRef);
      const firestoreDocs = qSnapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      })) as any[];

      // 2. Fetch Local Documents
      const localDocs = await ldb.getAll(STORE_NAME);

      const localMap = new Map<string, any>(localDocs.map(d => [d.id, d]));
      const firestoreMap = new Map<string, any>(firestoreDocs.map(d => [d.id, d]));

      const uploadList: any[] = [];
      const downloadList: any[] = [];

      // Helper to evaluate Date representation milliseconds
      const getMs = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'object' && val.toDate) return val.toDate().getTime();
        return new Date(val).getTime();
      };

      // Determine local-only or updated documents to upload
      for (const ldoc of localDocs) {
        const fdoc = firestoreMap.get(ldoc.id);
        if (!fdoc) {
          uploadList.push(ldoc);
          if (ldoc.isSynced !== false) {
            ldoc.isSynced = false;
            await ldb.put(STORE_NAME, ldoc);
          }
        } else {
          const lTime = getMs(ldoc.updatedAt || ldoc.modifiedAt);
          const fTime = getMs(fdoc.updatedAt || fdoc.modifiedAt);
          // Standard 1 second tolerance
          if (lTime > fTime + 1000) {
            uploadList.push(ldoc);
            if (ldoc.isSynced !== false) {
              ldoc.isSynced = false;
              await ldb.put(STORE_NAME, ldoc);
            }
          } else {
            if (!ldoc.isSynced) {
              ldoc.isSynced = true;
              await ldb.put(STORE_NAME, ldoc);
            }
          }
        }
      }

      // Determine Firestore documents to download
      for (const fdoc of firestoreDocs) {
        const ldoc = localMap.get(fdoc.id);
        if (!ldoc) {
          downloadList.push(fdoc);
        } else {
          const lTime = getMs(ldoc.updatedAt || ldoc.modifiedAt);
          const fTime = getMs(fdoc.updatedAt || fdoc.modifiedAt);
          if (fTime > lTime + 1000) {
            downloadList.push(fdoc);
          }
        }
      }

      const totalActions = uploadList.length + downloadList.length;

      if (totalActions === 0) {
        this.updateSyncStatus({
          state: 'synced',
          progress: 100,
          totalFiles: 0,
          syncedFiles: 0,
          lastSyncedAt: new Date().toISOString()
        });
        await this.calculateSyncRatios();
        return;
      }

      this.updateSyncStatus({
        state: 'syncing',
        progress: 0,
        totalFiles: totalActions,
        syncedFiles: 0
      });

      let completedActions = 0;

      // Execute uploads
      for (const ldoc of uploadList) {
        const docPath = `users/${userId}/documents/${ldoc.id}`;
        let success = false;
        try {
          const docRef = doc(db, 'users', userId, 'documents', ldoc.id);
          const firestoreDoc = {
            ...ldoc,
            isSynced: true,
            userId,
            updatedAt: serverTimestamp(),
            createdAt: ldoc.createdAt ? new Date(ldoc.createdAt) : serverTimestamp()
          };
          await setDoc(docRef, firestoreDoc, { merge: true });
          success = true;
        } catch (err) {
          console.error(`Upload failed for document ${ldoc.id}:`, err);
        }

        if (success) {
          await ldb.put(STORE_NAME, { ...ldoc, isSynced: true });
        }

        completedActions++;
        this.updateSyncStatus({
          syncedFiles: completedActions,
          progress: Math.round((completedActions / totalActions) * 100)
        });
        await this.calculateSyncRatios();
        // Create a visual pace for status transitions tracking
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Execute downloads
      for (const fdoc of downloadList) {
        try {
          const existingLocal = await ldb.get(STORE_NAME, fdoc.id);
          // Preserve local base64/local URL if Firestore doesn't provide one
          if (existingLocal && existingLocal.url && !fdoc.url) {
            const mergedDoc = { ...fdoc, url: existingLocal.url, isSynced: true };
            await ldb.put(STORE_NAME, mergedDoc);
          } else {
            await ldb.put(STORE_NAME, { ...fdoc, isSynced: true });
          }
        } catch (err) {
          console.error(`Download failed for document ${fdoc.id}:`, err);
        }

        completedActions++;
        this.updateSyncStatus({
          syncedFiles: completedActions,
          progress: Math.round((completedActions / totalActions) * 100)
        });
        await this.calculateSyncRatios();
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      this.updateSyncStatus({
        state: 'synced',
        progress: 100,
        lastSyncedAt: new Date().toISOString()
      });
      await this.calculateSyncRatios();

    } catch (err: any) {
      console.error("[Storage] Bidirectional sync engine error:", err);
      this.updateSyncStatus({
        state: 'error',
        errorMessage: err.message || "Erreur lors de la synchronisation cloud"
      });
    }
  }

  async saveDocument(document: DocumentMetadata) {
    const user = this.getCurrentUser();
    const userId = user?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false' && !(userId && userId.startsWith('guest_'));
    const now = new Date().toISOString();
    
    let documentCopy = { 
      ...document, 
      modifiedAt: now,
      updatedAt: now,
      isSynced: (document as any).isSynced === true,
      createdAt: document.createdAt instanceof Date 
        ? document.createdAt.toISOString() 
        : (document.createdAt || now)
    } as any;

    // Apply smart categorization/automation rules
    try {
      const savedRules = localStorage.getItem('zenScanAutomationRules');
      if (savedRules) {
        const rules = JSON.parse(savedRules);
        const activeRules = rules.filter((r: any) => r.isActive);
        
        activeRules.forEach((rule: any) => {
          const nameMatch = (documentCopy.name || '').toLowerCase().includes(rule.keyword);
          const snippetMatch = (documentCopy.contentSnippet || '').toLowerCase().includes(rule.keyword);
          
          let isMatch = false;
          if (rule.field === 'name') isMatch = nameMatch;
          else if (rule.field === 'content') isMatch = snippetMatch;
          else isMatch = nameMatch || snippetMatch;

          if (isMatch) {
            // Apply folder move if not set
            if (rule.folderId && !documentCopy.folderId) {
              documentCopy.folderId = rule.folderId;
            }
            // Append rule tags
            if (rule.tags && rule.tags.length > 0) {
              const currentTags = documentCopy.tags || [];
              documentCopy.tags = Array.from(new Set([...currentTags, ...rule.tags]));
            }
            // Add Favorite
            if (rule.isFavorite) {
              documentCopy.isFavorite = true;
            }
            // Add Prefix name
            if (rule.prefix && !documentCopy.name.startsWith(rule.prefix)) {
              documentCopy.name = `${rule.prefix}${documentCopy.name}`;
            }
          }
        });
      }
    } catch (e) {
      console.error("[Storage] Error executing automation trigger:", e);
    }

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
           isSynced: true,
           userId, // Ensure userId is set for rules
           updatedAt: serverTimestamp(),
           createdAt: document.createdAt ? new Date(document.createdAt) : serverTimestamp()
        };
        await setDoc(docRef, firestoreDoc, { merge: true });
        
        // Update local status with synced: true
        const ldb = await this.localDb;
        if (ldb) {
          documentCopy.isSynced = true;
          await ldb.put(STORE_NAME, documentCopy);
        }

        // Minor sync update
        this.updateSyncStatus({
          lastSyncedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    } else {
      // Trigger pending indicator if online but cloud sync is enabled manually later
      if (isCloudSyncEnabled) {
        this.updateSyncStatus({ state: 'pending' });
      }
    }

    await this.calculateSyncRatios();
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
    const user = this.getCurrentUser();
    const userId = user?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false' && !(userId && userId.startsWith('guest_'));
    let docs: any[] = [];

    // 1. Always start with Local Storage for instant UI (Rapid)
    try {
      const ldb = await this.localDb;
      if (ldb) {
        docs = await ldb.getAll(STORE_NAME);
        
        // If empty, seed database first time with the RECENT_SCANS
        if (docs.length === 0) {
          console.log("[Storage] Database empty, seeding with default library documents...");
          for (const item of RECENT_SCANS) {
            await this.saveDocument(item);
          }
          docs = await ldb.getAll(STORE_NAME);
        }
      }
    } catch (err) {
      console.error("Local storage read failed:", err);
    }

    // 2. Clear sync in background to update progress trackers and sync files
    if (userId && isCloudSyncEnabled && navigator.onLine) {
      // Non-blocking trigger of the bidirectional sync
      this.sync().catch(err => console.error("Auto background sync failure:", err));
    }

    const uniqueDocs = Array.from(new Map(docs.map(d => [d.id, d])).values());
    this.calculateSyncRatios().catch(err => console.error(err));
    return uniqueDocs.map(d => this.normalizeDoc(d)).sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  }

  async deleteDocument(docId: string) {
    const user = this.getCurrentUser();
    const userId = user?.uid;
    const isCloudSyncEnabled = localStorage.getItem('zenScanCloudSync') !== 'false' && !(userId && userId.startsWith('guest_'));

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
        this.updateSyncStatus({
          lastSyncedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    }
    await this.calculateSyncRatios();
  }

  // Handle background sync when coming back online
  initOnlineSync() {
    // Already set up inside initAuthAndOnlineListeners
  }

  // Sync user profile for better management
  async syncUserProfile() {
    const user = this.getCurrentUser();
    if (!user || !user.uid || user.uid.startsWith('guest_')) return;

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
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    }
  }
}

export const storageService = new StorageService();


