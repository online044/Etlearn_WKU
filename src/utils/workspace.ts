/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomNote } from '../types';
import { getSupabase } from './supabaseClient';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth } from './firebaseStore';

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Read cached token from session memory to preserve state between quick hot-reloads
try {
  cachedAccessToken = sessionStorage.getItem('ethiolearn_google_token');
} catch (e) {
  // Ignore fallback
}

/**
 * Listen for Firebase Auth / Supabase state changes
 */
export const initAuth = (
  onAuthSuccess: (user: any, accessToken: string) => void,
  onAuthFailure: () => void
) => {
  // 1. Firebase Auth listener (Primary)
  if (auth) {
    const unsubscribeFirebase = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        let token = cachedAccessToken;
        if (!token) {
          try {
            token = await user.getIdToken();
          } catch (e) {
            token = '';
          }
        }
        onAuthSuccess(user, token || '');
      } else {
        // Only trigger failure if Supabase is also inactive
        const supabase = getSupabase();
        if (!supabase) {
          cachedAccessToken = null;
          try {
            sessionStorage.removeItem('ethiolearn_google_token');
          } catch (e) {}
          onAuthFailure();
        }
      }
    });

    // 2. Supabase listener as fallback
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (session?.user) {
          const token = session.provider_token || session.access_token || '';
          cachedAccessToken = token;
          try {
            sessionStorage.setItem('ethiolearn_google_token', token);
          } catch (e) {}
          onAuthSuccess(session.user, token);
        } else if (event === 'SIGNED_OUT' && !auth?.currentUser) {
          cachedAccessToken = null;
          try {
            sessionStorage.removeItem('ethiolearn_google_token');
          } catch (e) {}
          onAuthFailure();
        }
      });

      return () => {
        unsubscribeFirebase();
        subscription.unsubscribe();
      };
    }

    return unsubscribeFirebase;
  }

  // If Firebase Auth is not available, check Supabase
  const supabase = getSupabase();
  if (supabase) {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) {
        const token = data.session.provider_token || data.session.access_token || '';
        cachedAccessToken = token;
        try {
          sessionStorage.setItem('ethiolearn_google_token', token);
        } catch (e) {}
        onAuthSuccess(data.session.user, token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (session?.user) {
        const token = session.provider_token || session.access_token || '';
        cachedAccessToken = token;
        try {
          sessionStorage.setItem('ethiolearn_google_token', token);
        } catch (e) {}
        onAuthSuccess(session.user, token);
      } else if (event === 'SIGNED_OUT') {
        cachedAccessToken = null;
        try {
          sessionStorage.removeItem('ethiolearn_google_token');
        } catch (e) {}
        onAuthFailure();
      }
    });

    return () => subscription.unsubscribe();
  }

  return () => {};
};

/**
 * Trigger Sign-In with Google Auth Popup (Firebase Auth primary, Supabase fallback)
 */
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  if (isSigningIn) return null;
  isSigningIn = true;

  try {
    // 1. Firebase Google Auth (Primary for AI Studio environment)
    if (auth) {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/docs');
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || (await result.user.getIdToken()) || '';
        if (token) {
          cachedAccessToken = token;
          try {
            sessionStorage.setItem('ethiolearn_google_token', token);
          } catch (e) {}
        }
        return { user: result.user, accessToken: token };
      } catch (fbErr: any) {
        console.warn('[Firebase Google Sign-In] Popup issue or cancellation:', fbErr);
        // If Supabase is available, attempt fallback, otherwise rethrow
        const supabase = getSupabase();
        if (!supabase) {
          throw fbErr;
        }
      }
    }

    // 2. Supabase fallback if configured
    const supabase = getSupabase();
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const token = sessionData.session.provider_token || sessionData.session.access_token || '';
        cachedAccessToken = token;
        return { user: sessionData.session.user, accessToken: token };
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/docs'
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
      return null;
    }

    throw new Error('Authentication service is not initialized.');
  } finally {
    isSigningIn = false;
  }
};

/**
 * Trigger Sign-In with Google Redirect
 */
export const googleSignInRedirect = async (): Promise<void> => {
  if (auth) {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.addScope('https://www.googleapis.com/auth/docs');
    await signInWithRedirect(auth, provider);
    return;
  }
  await googleSignIn();
};

/**
 * Retrieve cached token
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      cachedAccessToken = token;
      return token;
    } catch (e) {}
  }
  return null;
};

/**
 * Google Log Out
 */
export const logoutGoogle = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {}
  }
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem('ethiolearn_google_token');
  } catch (e) {}
};

/**
 * Extract plain text from HTML content
 */
function cleanHtml(html: string): string {
  let doc = html;
  // Basic Regex replacements to format raw HTML cleanly into text paragraphs
  doc = doc.replace(/<\/h[1-6]>/g, '\n\n');
  doc = doc.replace(/<\/p>/g, '\n\n');
  doc = doc.replace(/<br\s*\/?>/g, '\n');
  doc = doc.replace(/<li>/g, '\n• ');
  doc = doc.replace(/<\/li>/g, '');
  doc = doc.replace(/<\/pre>/g, '\n\n');
  doc = doc.replace(/<[^>]*>/g, '');
  
  // Clean double-spaces/newlines
  return doc.trim().replace(/\n{3,}/g, '\n\n');
}

/**
 * Export a Study Note to a beautiful Google Doc
 */
export async function exportNoteToGoogleDoc(
  title: string, 
  subject: string, 
  contentHtml: string, 
  token: string
): Promise<{ docId: string; url: string }> {
  const plainText = cleanHtml(contentHtml);
  const formattedContent = `ETHIOLEARN STUDY GUIDE\nSubject: ${subject.toUpperCase()}\nTopic: ${title.toUpperCase()}\nCreated At: ${new Date().toLocaleDateString()}\n=========================================\n\n${plainText}`;

  // 1. Create a fresh Google Document
  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: `${title} - EthioLearn Guideline`
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Google Docs Creation failed: ${errorText}`);
  }

  const documentData = await createResponse.json();
  const documentId = documentData.documentId;

  // 2. Insert formatted study contents into Google Document
  const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: formattedContent
          }
        }
      ]
    })
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Adding study text to Google Doc failed: ${errorText}`);
  }

  return {
    docId: documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`
  };
}

/**
 * Export customized search & Study Notes portfolio to Google Sheets
 */
export async function exportNotesToGoogleSheets(
  notes: CustomNote[], 
  token: string
): Promise<{ spreadsheetId: string; url: string }> {
  if (notes.length === 0) {
    throw new Error("No notes saved yet to export.");
  }

  // 1. Create Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      properties: {
        title: `EthioLearn Campus Notes Portfolio - ${new Date().toLocaleDateString()}`
      }
    })
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    throw new Error(`Failed to create Google Sheet: ${err}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Add header row and notes records
  const values = [
    ['Subject', 'Note Title', 'Saved Date', 'Snippet Preview', 'Raw Content']
  ];

  notes.forEach(note => {
    const plain = cleanHtml(note.content);
    const snippet = plain.substring(0, 150) + (plain.length > 150 ? '...' : '');
    values.push([
      note.subject,
      note.title,
      note.createdAt || new Date().toLocaleDateString(),
      snippet,
      plain
    ]);
  });

  // 3. Populate Sheet values
  const range = 'Sheet1!A1';
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        values: values
      })
    }
  );

  if (!updateResponse.ok) {
    const err = await updateResponse.text();
    throw new Error(`Failed to append sheets rows: ${err}`);
  }

  return {
    spreadsheetId,
    url: `https://sheets.google.com/create?id=${spreadsheetId}` // OR more accurately:
  };
}

/**
 * Export Learning Milestones & Study Logs to a beautiful Progress Sheet
 */
export async function exportAnalyticsToGoogleSheets(
  studentName: string,
  universityName: string,
  year: string,
  streak: number,
  studyHours: number,
  dailyGoal: number,
  token: string
): Promise<{ spreadsheetId: string; url: string }> {
  // 1. Create spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      properties: {
        title: `EthioLearn Study Metrics: ${studentName}`
      }
    })
  });

  if (!createResponse.ok) {
    const err = await createResponse.text();
    throw new Error(`Google Sheets creation failed: ${err}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Format a structured dashboard sheet
  const values = [
    ['EthioLearn Learning Portfolios & Performance Logs', '', '', ''],
    ['Generated At:', new Date().toLocaleString(), '', ''],
    ['', '', '', ''],
    ['STUDENT PARAMETERS', 'METRIC VALUE', 'STATUS', 'GUIDANCE'],
    ['Student Name', studentName, '', 'Active Portfolios'],
    ['Institution / University', universityName || 'Ethiopian High School/Uni', '', ''],
    ['Academic Year', year || 'Freshman / Sophomore', '', ''],
    ['', '', '', ''],
    ['LEARNING KPIS', 'LOGGED VALUES', 'TARGET GOALS', 'PROGRESS (PERCENT)'],
    ['Study Streak (Days)', streak, 'Daily continuous study', streak >= 5 ? 'EXCELLENT' : 'KEEP GOING'],
    ['Total Study Hours', studyHours, 'Cumulative Campus Hours', ''],
    ['Daily Hours Target', dailyGoal, 'Hours per Day', `${Math.round((1.2 / dailyGoal) * 100)}% Today`],
    ['', '', '', ''],
    ['Weekly Review Matrix', 'Log date', 'Hours Studied', 'Mastered cards count'],
    ['Log Entry 1', new Date().toLocaleDateString(), '1.2 Hours', '48 cards']
  ];

  const range = 'Sheet1!A1';
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        values: values
      })
    }
  );

  if (!updateResponse.ok) {
    const err = await updateResponse.text();
    throw new Error(`Failed to initialize dashboard spreadsheet rows: ${err}`);
  }

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}


