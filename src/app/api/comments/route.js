// src/app/api/comments/route.js
export const runtime = 'nodejs';
import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';

function getUserFromToken(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
}

// GET - Récupérer tous les commentaires avec leurs réponses
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    let queryText = `
      SELECT 
        c.*,
        u.id as user_id,
        u.prenom as user_prenom,
        u.nom as user_nom,
        u.email as user_email,
        u.photo as user_photo,
        u.role as user_role,
        a.id as article_id,
        a.titre as article_titre
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN actualites a ON c.article_id = a.id
      WHERE 1=1
    `;

    const queryParams = [];
    
    if (articleId) {
      const articleIdNum = parseInt(articleId);
      if (!isNaN(articleIdNum)) {
        queryText += ` AND c.article_id = $1`;
        queryParams.push(articleIdNum);
      }
    }

    queryText += ` ORDER BY c.created_at ASC`; // ✅ ASC pour afficher chronologiquement

    const result = await query(queryText, queryParams);

    // Organiser les commentaires en arbre (parents et enfants)
    const commentsMap = new Map();
    const rootComments = [];

    // Première passe : créer tous les commentaires
    result.rows.forEach(row => {
      const comment = {
        id: row.id,
        article_id: row.article_id,
        user_id: row.user_id,
        parent_id: row.parent_id,
        contenu: row.contenu,
        created_at: row.created_at,
        updated_at: row.updated_at,
        users: {
          id: row.user_id,
          prenom: row.user_prenom,
          nom: row.user_nom,
          email: row.user_email,
          photo_profil: row.user_photo,
          role: row.user_role
        },
        actualites: {
          id: row.article_id,
          titre: row.article_titre
        },
        replies: [] // ✅ Array pour stocker les réponses
      };
      
      commentsMap.set(comment.id, comment);
    });

    // Deuxième passe : organiser en arbre
    commentsMap.forEach(comment => {
      if (comment.parent_id) {
        // C'est une réponse, l'ajouter au parent
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        // C'est un commentaire principal
        rootComments.push(comment);
      }
    });

    return Response.json({ comments: rootComments });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération des commentaires' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau commentaire ou une réponse
export async function POST(request) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return Response.json(
        { error: 'Authentification requise pour commenter' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { article_id, contenu, parent_id } = body; // ✅ Ajout de parent_id

    // Validation
    if (!article_id || !contenu) {
      return Response.json(
        { error: 'L\'ID de l\'article et le contenu sont requis' },
        { status: 400 }
      );
    }

    const articleIdNum = parseInt(article_id);
    if (isNaN(articleIdNum)) {
      return Response.json(
        { error: 'L\'ID de l\'article doit être un nombre valide' },
        { status: 400 }
      );
    }

    if (contenu.trim().length < 3) {
      return Response.json(
        { error: 'Le commentaire doit contenir au moins 3 caractères' },
        { status: 400 }
      );
    }

    if (contenu.length > 2000) {
      return Response.json(
        { error: 'Le commentaire ne peut pas dépasser 2000 caractères' },
        { status: 400 }
      );
    }

    // ✅ Si parent_id est fourni, vérifier que le commentaire parent existe
    if (parent_id) {
      const parentIdNum = parseInt(parent_id);
      if (isNaN(parentIdNum)) {
        return Response.json(
          { error: 'L\'ID du commentaire parent doit être un nombre valide' },
          { status: 400 }
        );
      }

      const parentCheck = await query(
        'SELECT id FROM comments WHERE id = $1',
        [parentIdNum]
      );

      if (parentCheck.rows.length === 0) {
        return Response.json(
          { error: 'Commentaire parent introuvable' },
          { status: 404 }
        );
      }
    }

    // Vérifier que l'article existe
    const articleCheck = await query(
      'SELECT id FROM actualites WHERE id = $1',
      [articleIdNum]
    );

    if (articleCheck.rows.length === 0) {
      return Response.json(
        { error: 'Article introuvable' },
        { status: 404 }
      );
    }

    // Créer le commentaire ou la réponse
    const insertResult = await query(
      `INSERT INTO comments (article_id, user_id, parent_id, contenu, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [articleIdNum, user.userId, parent_id || null, contenu.trim()]
    );

    const commentId = insertResult.rows[0].id;

    // Récupérer le commentaire créé avec les données de l'utilisateur
    const selectResult = await query(
      `SELECT 
        c.*,
        u.id as user_id,
        u.prenom as user_prenom,
        u.nom as user_nom,
        u.email as user_email,
        u.photo as user_photo,
        u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [commentId]
    );

    const row = selectResult.rows[0];
    const comment = {
      id: row.id,
      article_id: row.article_id,
      user_id: row.user_id,
      parent_id: row.parent_id,
      contenu: row.contenu,
      created_at: row.created_at,
      updated_at: row.updated_at,
      users: {
        id: row.user_id,
        prenom: row.user_prenom,
        nom: row.user_nom,
        email: row.user_email,
        photo_profil: row.user_photo,
        role: row.user_role
      },
      replies: []
    };

    console.log('✅ Commentaire créé:', parent_id ? 'Réponse' : 'Commentaire principal');

    return Response.json(
      { 
        message: parent_id ? 'Réponse créée avec succès' : 'Commentaire créé avec succès',
        comment 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur serveur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la création du commentaire' },
      { status: 500 }
    );
  }
}