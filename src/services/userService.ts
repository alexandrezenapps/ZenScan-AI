import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

/**
 * Service pour gérer les données utilisateur dans Firestore
 */
export const userService = {
  /**
   * Met à jour les données de l'utilisateur connecté
   * @param data Les données à fusionner
   */
  async writeUserData(data: Record<string, any>) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Aucun utilisateur connecté.");
    }

    try {
      // Pour une meilleure sécurité, on force le rafraîchissement du token si nécessaire
      await user.getIdToken(true);

      const userRef = doc(db, 'users', user.uid);
      
      // On s'assure que les données respectent les règles de sécurité
      // En particulier, updatedAt DOIT être serverTimestamp() pour passer les règles strictes
      await setDoc(userRef, {
        ...data,
        uid: user.uid, // Toujours inclure l'UID pour la validation
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log("Écriture réussie pour :", user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  },

  /**
   * Récupère les données d'un utilisateur
   */
  async getUserData(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      return null;
    }
  }
};
