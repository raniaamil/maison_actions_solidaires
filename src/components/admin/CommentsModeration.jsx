// src/components/admin/CommentsModeration.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';

export default function CommentsModeration() {
  const { getToken } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, recent, byArticle
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger tous les commentaires
  const fetchAllComments = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/comments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      setComments(data.comments || []);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllComments();
  }, []);

  // Supprimer un commentaire (modération)
  const handleDelete = async (commentId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ? Cette action est irréversible.')) {
      return;
    }

    try {
      const token = getToken(); // ✅ Changé ici
      
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
      const token = getToken(); // ✅ Changé ici
      
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
        throw new Error(errorData.error || 'Erreur lors de la modification');
      }

      const data = await response.json();
      
      setComments(comments.map(c => 
        c.id === commentId ? data.comment : c
      ));
      
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('❌ Erreur modification:', err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les commentaires
  const filteredComments = comments.filter(comment => {
    const matchesSearch = 
      comment.contenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${comment.users?.prenom} ${comment.users?.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.actualites?.titre?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(comment.created_at) > oneWeekAgo;
    }

    return matchesSearch;
  });

  // Grouper par article si nécessaire
  const groupedByArticle = filter === 'byArticle' 
    ? filteredComments.reduce((acc, comment) => {
        const articleId = comment.article_id;
        if (!acc[articleId]) {
          acc[articleId] = {
            article: comment.actualites,
            comments: []
          };
        }
        acc[articleId].comments.push(comment);
        return acc;
      }, {})
    : null;

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
      {/* En-tête avec statistiques */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Modération des commentaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-600 text-sm font-medium">Total commentaires</p>
            <p className="text-3xl font-bold text-blue-900">{comments.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 text-sm font-medium">Cette semaine</p>
            <p className="text-3xl font-bold text-green-900">
              {comments.filter(c => {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return new Date(c.created_at) > oneWeekAgo;
              }).length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-600 text-sm font-medium">Utilisateurs actifs</p>
            <p className="text-3xl font-bold text-purple-900">
              {new Set(comments.map(c => c.user_id)).size}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par contenu, auteur ou article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'recent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Récents
            </button>
            <button
              onClick={() => setFilter('byArticle')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'byArticle' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Par article
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {filteredComments.length} commentaire{filteredComments.length !== 1 ? 's' : ''} affiché{filteredComments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste des commentaires */}
      {filteredComments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-600">Aucun commentaire trouvé</p>
        </div>
      ) : filter === 'byArticle' ? (
        // Vue groupée par article
        <div className="space-y-6">
          {Object.entries(groupedByArticle).map(([articleId, { article, comments: articleComments }]) => (
            <div key={articleId} className="bg-white border rounded-lg p-6">
              <div className="mb-4 pb-4 border-b">
                <Link 
                  href={`/actualites/${articleId}`}
                  className="text-xl font-bold text-blue-600 hover:underline"
                >
                  {article?.titre || 'Article sans titre'}
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {articleComments.length} commentaire{articleComments.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-4">
                {articleComments.map(comment => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    editingId={editingId}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    isSubmitting={isSubmitting}
                    startEdit={startEdit}
                    cancelEdit={cancelEdit}
                    saveEdit={saveEdit}
                    handleDelete={handleDelete}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue liste simple
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              isSubmitting={isSubmitting}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveEdit={saveEdit}
              handleDelete={handleDelete}
              formatDate={formatDate}
              showArticle={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Composant carte de commentaire réutilisable avec Avatar
function CommentCard({ 
  comment, 
  editingId, 
  editContent, 
  setEditContent, 
  isSubmitting,
  startEdit, 
  cancelEdit, 
  saveEdit, 
  handleDelete, 
  formatDate,
  showArticle = false 
}) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* En-tête avec avatar */}
      <div className="flex gap-4 mb-4">
        {/* ✅ Avatar ajouté */}
        <Avatar 
          src={comment.users?.photo_profil}
          alt={`${comment.users?.prenom || ''} ${comment.users?.nom || ''}`}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">
                {comment.users?.prenom} {comment.users?.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">{comment.users?.email}</p>

              {showArticle && (
                <Link 
                  href={`/actualites/${comment.article_id}`}
                  className="text-sm text-blue-600 hover:underline inline-block mt-1"
                >
                  → {comment.actualites?.titre || 'Article'}
                </Link>
              )}

              <p className="text-sm text-gray-500 mt-1">
                {formatDate(comment.created_at)}
                {comment.updated_at !== comment.created_at && (
                  <span className="ml-2 italic">(modifié)</span>
                )}
              </p>
            </div>

            {/* Actions admin */}
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
        </div>
      </div>

      {/* Contenu */}
      {editingId === comment.id ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500"
            rows="4"
            maxLength={2000}
          />
          <div className="flex gap-3">
            <button
              onClick={() => saveEdit(comment.id)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
        <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
          {comment.contenu}
        </p>
      )}
    </div>
  );
}