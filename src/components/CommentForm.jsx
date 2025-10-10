// src/components/CommentForm.jsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CommentForm({ articleId, onCommentAdded, editMode = false, initialValue = '', commentId = null, onCancel = null }) {
  const { getToken } = useAuth();
  const [contenu, setContenu] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (contenu.trim().length < 3) {
      setError('Le commentaire doit contenir au moins 3 caractères');
      return;
    }

    if (contenu.length > 2000) {
      setError('Le commentaire ne peut pas dépasser 2000 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      
      if (!token) {
        setError('Vous devez être connecté pour commenter');
        return;
      }

      const url = editMode 
        ? `/api/comments/${commentId}` 
        : '/api/comments';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_id: articleId,
          contenu: contenu.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission du commentaire');
      }

      // Réinitialiser le formulaire
      setContenu('');
      setError(null);

      // Notifier le parent
      if (onCommentAdded && data.comment) {
        onCommentAdded(data.comment);
      }

      // Si mode édition, fermer le formulaire
      if (editMode && onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-[1200px] mx-auto">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-r mb-4 flex items-start">
          <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-gray-200 overflow-hidden transition-all duration-200">
        <div className="p-6">
          <label htmlFor="comment" className="flex items-center text-base font-semibold text-gray-800 mb-3">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {editMode ? 'Modifier votre commentaire' : 'Laisser un commentaire'}
          </label>
          <textarea
            id="comment"
            rows="5"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 placeholder-gray-400"
            placeholder="Partagez votre avis, posez une question ou participez à la discussion..."
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            disabled={loading}
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className={`flex items-center ${contenu.length > 1900 ? 'text-orange-600 font-medium' : ''}`}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {contenu.length} / 2000
              </span>
              {contenu.length >= 3 && (
                <span className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Prêt à publier
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Soyez respectueux et constructif
          </div>
          
          <div className="flex gap-3">
            {editMode && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                disabled={loading}
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={loading || contenu.trim().length < 3}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Publication...</span>
                </>
              ) : (
                <span>{editMode ? 'Modifier' : 'Publier'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}