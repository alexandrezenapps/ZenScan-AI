import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, signInWithGoogle as firebaseSignInWithGoogle, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            // Update profile info and updatedAt
            await setDoc(userRef, {
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('permission')) {
            // Log but don't throw to prevent blocking the app
            try {
              handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
            } catch (e) {
              console.error("Critical Firestore Error logged");
            }
          } else {
            console.error("Error syncing user", error);
          }
        }
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await firebaseSignInWithGoogle();
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
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
