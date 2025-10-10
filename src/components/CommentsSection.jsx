// src/components/CommentsSection.jsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

export default function CommentsSection({ articleId }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les commentaires
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?articleId=${articleId}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commentaires');
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
    if (articleId) {
      fetchComments();
    }
  }, [articleId]);

  // Compter le total de commentaires (parents + réponses)
  const getTotalCommentsCount = () => {
    let total = comments.length;
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.length;
      }
    });
    return total;
  };

  // Callback après ajout d'un commentaire principal
  const handleCommentAdded = (newComment) => {
    setComments([...comments, newComment]);
  };

  // Callback après ajout d'une réponse
  const handleReplyAdded = (newReply) => {
    setComments(comments.map(comment => {
      if (comment.id === newReply.parent_id) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    }));
  };

  // Callback après modification d'un commentaire
  const handleCommentUpdated = (updatedComment) => {
    // Mettre à jour un commentaire principal
    const updatedComments = comments.map(comment => {
      if (comment.id === updatedComment.id) {
        return { ...comment, ...updatedComment };
      }
      // Mettre à jour une réponse
      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = comment.replies.map(reply => 
          reply.id === updatedComment.id ? { ...reply, ...updatedComment } : reply
        );
        return { ...comment, replies: updatedReplies };
      }
      return comment;
    });
    setComments(updatedComments);
  };

  // Callback après suppression d'un commentaire
  const handleCommentDeleted = (commentId) => {
    // Supprimer un commentaire principal
    const filteredComments = comments.filter(comment => comment.id !== commentId);
    
    // Ou supprimer une réponse
    const commentsWithUpdatedReplies = filteredComments.map(comment => {
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.filter(reply => reply.id !== commentId)
        };
      }
      return comment;
    });
    
    setComments(commentsWithUpdatedReplies);
  };

  if (loading) {
    return (
      <div className="mt-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t pt-8 max-w-[1200px] mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Commentaires ({getTotalCommentsCount()})
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Formulaire d'ajout de commentaire */}
      {isAuthenticated() ? (
        <CommentForm 
          articleId={articleId}
          onCommentAdded={handleCommentAdded}
        />
      ) : (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
          <p>
            Vous devez être{' '}
            <a href="/se-connecter" className="font-semibold underline hover:text-blue-900">
              connecté
            </a>
            {' '}pour laisser un commentaire.
          </p>
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-6 mt-8">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun commentaire pour le moment. Soyez le premier à commenter !
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onReplyAdded={handleReplyAdded}
            />
          ))
        )}
      </div>
    </div>
  );
}