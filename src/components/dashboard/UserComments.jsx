// src/components/dashboard/UserComments.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import Pagination from '../ui/Pagination';

const ITEMS_PER_PAGE = 20;

export default function UserComments() {
  const { getToken } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Charger les commentaires de l'utilisateur
  const fetchUserComments = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Récupérer l'ID utilisateur depuis le token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      // Récupérer tous les commentaires puis filtrer côté client
      const response = await fetch('/api/comments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      
      // Filtrer les commentaires de l'utilisateur
      const userComments = data.comments.filter(c => c.user_id === userId);
      setComments(userComments);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserComments();
  }, []);

  // Supprimer un commentaire
  const handleDelete = async (commentId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      return;
    }

    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      alert(err.message);
    }
  };

  // Démarrer l'édition
  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.contenu);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // Sauvegarder la modification
  const saveEdit = async (commentId) => {
    if (editContent.trim().length < 3) {
      alert('Le commentaire doit contenir au moins 3 caractères');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contenu: editContent.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur serveur:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la modification');
      }

      const data = await response.json();
      console.log('✅ Commentaire modifié:', data);
      
      // Mettre à jour le commentaire dans la liste
      setComments(comments.map(c => 
        c.id === commentId ? data.comment : c
      ));
      
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('❌ Erreur:', err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculer les commentaires paginés
  const getPaginatedComments = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return comments.slice(startIndex, endIndex);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mes commentaires</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-600 mb-4">Vous n'avez pas encore de commentaires</p>
          <Link href="/actualites" className="text-blue-600 hover:underline">
            Découvrir les actualités →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {getPaginatedComments().map((comment) => (
              <div key={comment.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* En-tête avec avatar et infos */}
                <div className="flex gap-4 mb-4">
                  {/* Avatar */}
                  <Avatar 
                    src={comment.users?.photo_profil}
                    alt={`${comment.users?.prenom || ''} ${comment.users?.nom || ''}`}
                    size="md"
                  />
                  
                  {/* Informations et actions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/actualites/${comment.article_id}`}
                          className="text-lg font-semibold text-blue-600 hover:underline block truncate"
                        >
                          {comment.actualites?.titre || 'Article'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium text-gray-900">
                            {comment.users?.prenom} {comment.users?.nom}
                          </span>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-gray-500">
                            {formatDate(comment.created_at)}
                            {comment.updated_at !== comment.created_at && (
                              <span className="ml-2 italic">(modifié)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {editingId !== comment.id && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
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
                    {editingId === comment.id ? (
                      <div className="mt-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="4"
                          maxLength={2000}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => saveEdit(comment.id)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap mt-3">{comment.contenu}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={comments.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}