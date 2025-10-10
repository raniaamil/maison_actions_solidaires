// src/components/CommentItem.jsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './ui/Avatar';

export default function CommentItem({ 
  comment, 
  currentUser, 
  onCommentUpdated, 
  onCommentDeleted,
  onReplyAdded,
  isReply = false 
}) {
  const { getToken, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editContent, setEditContent] = useState(comment.contenu);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Vérifier si l'utilisateur courant peut modifier/supprimer ce commentaire
  const canModify = currentUser && (
    currentUser.userId === comment.user_id || 
    currentUser.isAdmin
  );

  const isAuthorAdmin = comment.users?.role === 'Administrateur';

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Gérer la modification
  const handleSaveEdit = async () => {
    if (editContent.trim().length < 3) {
      alert('Le commentaire doit contenir au moins 3 caractères');
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const token = getToken();
      
      if (!token) {
        alert('Vous devez être connecté');
        return;
      }

      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contenu: editContent.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      const data = await response.json();

      // Notifier le parent
      if (onCommentUpdated) {
        onCommentUpdated(data.comment);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Gérer la suppression
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const token = getToken();
      
      if (!token) {
        alert('Vous devez être connecté');
        return;
      }

      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Notifier le parent
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Gérer l'envoi de la réponse
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (replyContent.trim().length < 3) {
      alert('La réponse doit contenir au moins 3 caractères');
      return;
    }

    setIsSubmittingReply(true);

    try {
      const token = getToken();
      
      if (!token) {
        alert('Vous devez être connecté');
        return;
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_id: comment.article_id,
          contenu: replyContent.trim(),
          parent_id: comment.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la réponse');
      }

      const data = await response.json();

      // Notifier le parent
      if (onReplyAdded) {
        onReplyAdded(data.comment);
      }

      setReplyContent('');
      setIsReplying(false);
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-12 mt-4' : ''}`}>
      <div className="bg-gray-50 border rounded-lg p-6 hover:shadow-md transition-shadow">
        {/* En-tête du commentaire */}
        <div className="flex gap-4 mb-4">
          {/* Avatar */}
          <Avatar 
            src={comment.users?.photo_profil}
            alt={`${comment.users?.prenom || ''} ${comment.users?.nom || ''}`}
            size="md"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">
                    {comment.users?.prenom} {comment.users?.nom}
                  </p>
                  {isAuthorAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Équipe
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDate(comment.created_at)}
                  {comment.updated_at !== comment.created_at && (
                    <span className="ml-2 italic">(modifié)</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              {canModify && !isEditing && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                    title="Modifier"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Contenu du commentaire */}
            {isEditing ? (
              <div className="mt-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  maxLength={2000}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.contenu);
                    }}
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200 mt-3">
                  {comment.contenu}
                </p>

                {/* Bouton Répondre (admin seulement, pas sur les réponses) */}
                {!isReply && isAdmin() && !isReplying && (
                  <button
                    onClick={() => setIsReplying(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Répondre
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Formulaire de réponse */}
        {isReplying && (
          <form onSubmit={handleSubmitReply} className="mt-4 ml-12 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre réponse
            </label>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500"
              rows="3"
              maxLength={2000}
              placeholder="Écrivez votre réponse..."
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmittingReply || replyContent.trim().length < 3}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmittingReply ? 'Envoi...' : 'Publier la réponse'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                disabled={isSubmittingReply}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Afficher les réponses */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              isReply={true}
            />
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}