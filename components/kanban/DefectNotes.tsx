'use client';

import { useState, useEffect } from 'react';
import { Defect } from '@/types';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

interface DefectNotesProps {
  defect: Defect;
}

export function DefectNotes({ defect }: DefectNotesProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [defect.id]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/defects/${defect.id}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/defects/${defect.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNote }),
      });

      if (res.ok) {
        setNewNote('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Notes &amp; Updates</h3>

      {/* Screen reader status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {loading ? 'Adding note...' : ''}
      </div>

      {/* Existing Notes */}
      <div
        className="space-y-3 mb-4 max-h-60 overflow-y-auto"
        role="log"
        aria-label="Defect notes history"
      >
        {comments.length === 0 && (
          <p className="text-sm text-gray-500 italic">No notes yet. Add one below.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-800 text-sm">{comment.text}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Add Note */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="defect-note-input" className="sr-only">
          Add a note or progress update
        </label>
        <textarea
          id="defect-note-input"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note or progress update..."
          className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-20 text-gray-900 placeholder:text-gray-400 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-describedby="note-hint"
        />
        <span id="note-hint" className="sr-only">
          Press the Add Note button to submit your note
        </span>
        <button
          onClick={addNote}
          disabled={loading || !newNote.trim()}
          className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-busy={loading}
        >
          {loading ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </div>
  );
}
