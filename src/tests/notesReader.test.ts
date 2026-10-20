/**
 * Test suite for Supabase Notes Reading Experience
 * Covers:
 * 1. Heading-to-TOC generator (levels 1-3, slug generation, duplicate resolution)
 * 2. KaTeX equation & Callout parsing
 * 3. Reading time calculation
 * 4. Offline sync queue & debounced progress persistence
 * 5. Repository layer data access and offline fallback
 */

import { generateToc, calculateReadingTime, renderMathKaTeX } from '../utils/markdownUtils';
import {
  enqueueSyncAction,
  getSyncQueue,
  clearSyncQueue,
  cacheFullNoteLocally,
  getCachedNoteLocally
} from '../utils/notesOfflineSync';
import { notesRepository, SEED_NOTES } from '../repositories/notesRepository';
import { Note } from '../types/notes';

export async function runNotesTestSuite(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      results.push(`✅ PASS: ${testName}`);
    } else {
      results.push(`❌ FAIL: ${testName}`);
      allPassed = false;
    }
  }

  try {
    // ─── 1. Heading-to-TOC Generator Tests ───
    const sampleMarkdown = `
# Introduction to Logic
Welcome students.
## Premises and Arguments
Here are definitions.
### Deduction vs Induction
Sub details.
## Premises and Arguments
Duplicate heading test.
`;
    const toc = generateToc(sampleMarkdown);

    assert(toc.length === 4, 'TOC generates exactly 4 items for headings');
    assert(toc[0].level === 1 && toc[0].text === 'Introduction to Logic', 'First heading is H1 with correct text');
    assert(toc[1].level === 2 && toc[1].id === 'premises-and-arguments', 'Second heading generates clean slug ID');
    assert(toc[2].level === 3, 'Third heading is level 3');
    assert(toc[3].id === 'premises-and-arguments-1', 'Duplicate heading receives unique -1 suffix');

    // ─── 2. Reading Time Estimation ───
    const words200 = new Array(200).fill('word').join(' ');
    const words450 = new Array(450).fill('word').join(' ');
    assert(calculateReadingTime(words200) === 1, '200 words calculated as 1 minute');
    assert(calculateReadingTime(words450) === 3, '450 words calculated as 3 minutes');

    // ─── 3. KaTeX Equation Rendering ───
    const mathText = 'Calculus: $E = mc^2$ and block $$\\int_0^1 x dx$$';
    const renderedMath = renderMathKaTeX(mathText);
    assert(renderedMath.includes('katex'), 'KaTeX rendered HTML contains katex class');
    assert(!renderedMath.includes('$$'), 'Block delimiter is replaced with katex block wrapper');

    // ─── 4. Offline Sync Queue & Coalescing ───
    clearSyncQueue();
    assert(getSyncQueue().length === 0, 'Queue is initially empty');

    enqueueSyncAction({
      type: 'UPSERT_NOTE_STATE',
      payload: { note_id: 'test_note_1', progress: 25, scroll_position: 300 }
    });
    assert(getSyncQueue().length === 1, 'Action successfully enqueued');

    // Test debounced coalescing: second state update for the same note overwrites payload without duplicate entries
    enqueueSyncAction({
      type: 'UPSERT_NOTE_STATE',
      payload: { note_id: 'test_note_1', progress: 50, scroll_position: 600 }
    });
    const queueAfterCoalesce = getSyncQueue();
    assert(queueAfterCoalesce.length === 1, 'Coalescing prevents queue bloat for same note ID');
    assert(queueAfterCoalesce[0].payload.progress === 50, 'Coalesced item has latest progress state (50%)');

    // ─── 5. Offline Cache & Repository Fallback ───
    const testNote: Note = {
      id: 'mock_uuid_123',
      chapter_id: 'mock_chapter',
      title: 'Mock Note',
      content: '# Mock Content',
      read_time_min: 5,
      sort_order: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    cacheFullNoteLocally(testNote);
    const cached = getCachedNoteLocally('mock_uuid_123');
    assert(cached?.title === 'Mock Note', 'Note cached and retrieved from local storage');

    // Repository fetchNoteById returns seed note when offline or not found on network
    const seedNote = await notesRepository.fetchNoteById(SEED_NOTES[0].id);
    assert(seedNote !== null && seedNote.title === SEED_NOTES[0].title, 'Repository returns seed note as resilient fallback');

    // Adjacent notes navigation
    const adjacent = await notesRepository.getAdjacentNotes(SEED_NOTES[0].chapter_id, 1);
    assert(adjacent.next !== null && adjacent.prev === null, 'Adjacent notes correctly calculates next note for sort_order 1');

  } catch (err: any) {
    results.push(`💥 EXCEPTION during test execution: ${err?.message || err}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}
