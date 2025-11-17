'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    console.error("Anonymous sign-in failed", error);
    // Optionally emit a generic error here if needed
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        const authError = new FirestorePermissionError({
            path: 'auth/signup',
            operation: 'create',
            requestResourceData: { email: email, error: error.message },
        });
        errorEmitter.emit('permission-error', authError);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        const authError = new FirestorePermissionError({
            path: 'auth/signin',
            operation: 'get',
            requestResourceData: { email: email, error: 'Invalid credentials. Please try again.' },
        });
        errorEmitter.emit('permission-error', authError);
    });
}