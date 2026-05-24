import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, signInWithGoogle as firebaseSignInWithGoogle, signInAsGuest as firebaseSignInAsGuest, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createMockGuestUser = () => {
    let storedUid = localStorage.getItem('zenScanGuestUID');
    if (!storedUid) {
      storedUid = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('zenScanGuestUID', storedUid);
    }
    return {
      uid: storedUid,
      email: 'guest@zenscan.local',
      displayName: 'Invité Zen',
      photoURL: '',
      isAnonymous: true,
      emailVerified: false,
      phoneNumber: null,
      providerId: 'firebase',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'mock-token',
      getIdTokenResult: async () => ({ token: 'mock-token', claims: {}, authTime: '', expirationTime: '', signInProvider: 'anonymous', issuedAtTime: '' }),
      reload: async () => {},
      toJSON: () => ({}),
      providerData: [],
      metadata: {},
    } as unknown as User;
  };

  useEffect(() => {
    const storedLocalGuest = localStorage.getItem('zenScanLocalGuestUser');
    if (storedLocalGuest) {
      try {
        const parsed = JSON.parse(storedLocalGuest);
        setUser(parsed);
        setLoading(false);
      } catch (e) {
        console.error("Failed to restore local guest session", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        localStorage.removeItem('zenScanLocalGuestUser');
        if (!fbUser.uid) {
          setUser(fbUser);
          setLoading(false);
          return;
        }
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || "",
              photoURL: fbUser.photoURL || "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(userRef, {
              displayName: fbUser.displayName || "",
              photoURL: fbUser.photoURL || "",
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('permission')) {
            try {
              handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
            } catch (e) {
              console.error("Critical Firestore Error logged");
            }
          } else {
            console.error("Error syncing user", error);
          }
        }
        setUser(fbUser);
        setLoading(false);
      } else {
        const stillGuest = localStorage.getItem('zenScanLocalGuestUser');
        if (stillGuest) {
          try {
            setUser(JSON.parse(stillGuest));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    localStorage.removeItem('zenScanLocalGuestUser');
    await firebaseSignInWithGoogle();
  };

  const signInAsGuest = async () => {
    try {
      await firebaseSignInAsGuest();
      localStorage.removeItem('zenScanLocalGuestUser');
    } catch (error: any) {
      console.warn("Standard Firebase anonymous login failed. Instantiating fully local and offline guest session fallback:", error);
      
      const mockUser = createMockGuestUser();
      localStorage.setItem('zenScanLocalGuestUser', JSON.stringify(mockUser));
      setUser(mockUser);
      setLoading(false);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('zen-scan-guest-auth-changed'));
      }
    }
  };

  const logout = async () => {
    localStorage.removeItem('zenScanLocalGuestUser');
    await signOut(auth);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('zen-scan-guest-auth-changed'));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
