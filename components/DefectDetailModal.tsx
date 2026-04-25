'use client';

import { useState, useEffect } from 'react';
import { Defect, Comment } from '@/types';
import { ImageGallery } from './ImageGallery';

interface DefectDetailModalProps {
  defect: Defect | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (defect: Defect) => void;
}

export function DefectDetailModal({ defect, isOpen, onClose, onUpdate }: DefectDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'comments'>('details');

  useEffect(() => {
    if (!defect || !isOpen) return;
    
    // Fetch comments - state updates happen in async callback, not synchronous effect body
    let cancelled = false;
    const doFetch = async () => {
      try {
        const res = await fetch(`/api/defects/${defect.id}/comments`);
        const data = await res.json();
        if (!cancelled && data.success) {
          setComments(data.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch comments:', error);
        }
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [defect, isOpen]);

  // Helper to fetch comments (used by handleAddComment)
  const fetchComments = async () => {
    if (!defect) return;
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

  const handleAddComment = async () => {
    if (!defect || !newComment.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/defects/${defect.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });
      
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    if (!defect) return;
    
    const updatedImages = (defect.images || []).filter((_, i) => i !== imageIndex);
    
    try {
      const res = await fetch(`/api/defects/${defect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedImages }),
      });
      
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.data);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  if (!isOpen || !defect) return null;

  const statusColors: Record<string, string> = {
    TODO: 'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-gray-500">{defect.defectNumber}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[defect.status]}`}>
                {defect.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{defect.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors
              ${activeTab === 'details' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors
              ${activeTab === 'images' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Images {(defect.images?.length || 0) > 0 && `(${defect.images?.length || 0})`}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors
              ${activeTab === 'comments' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Comments {comments.length > 0 && `(${comments.length})`}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-600 whitespace-pre-wrap">{defect.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-gray-600">{defect.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard Reference</label>
                  <p className="text-gray-600">{defect.standardReference || 'Not specified'}</p>
                </div>
              </div>

              <div className="text-sm text-gray-500 pt-4 border-t">
                <p>Created: {new Date(defect.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(defect.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Defect Images
              </h3>
              <ImageGallery 
                images={defect.images || []} 
                onDelete={handleDeleteImage}
                allowDelete={true}
              />
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-800">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2 pt-4 border-t">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
