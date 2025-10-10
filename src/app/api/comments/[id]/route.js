// src/app/api/comments/[id]/route.js
export const runtime = 'nodejs';
import { query } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

// Fonction pour extraire et vérifier le token JWT
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

// GET - Récupérer un commentaire spécifique (public)
export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
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
      WHERE c.id = $1`,
      [commentId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Commentaire introuvable' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const comment = {
      id: row.id,
      article_id: row.article_id,
      user_id: row.user_id,
      contenu: row.contenu,
      created_at: row.created_at,
      updated_at: row.updated_at,
      users: {
        id: row.user_id,
        prenom: row.user_prenom,
        nom: row.user_nom,
        email: row.user_email,
        photo_profil: row.user_photo
      },
      actualites: {
        id: row.article_id,
        titre: row.article_titre
      }
    };

    return Response.json({ comment }, { status: 200 });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération du commentaire' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un commentaire
export async function PUT(request, context) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return Response.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { contenu } = body;

    // Validation
    if (!contenu) {
      return Response.json(
        { error: 'Le contenu est requis' },
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

    // Récupérer le commentaire existant
    const existingResult = await query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    );

    if (existingResult.rows.length === 0) {
      return Response.json(
        { error: 'Commentaire introuvable' },
        { status: 404 }
      );
    }

    const existingComment = existingResult.rows[0];

    // Vérifier les permissions
    const isOwner = existingComment.user_id === user.userId;
    const isAdmin = user.isAdmin === true || user.role === 'Administrateur';

    console.log('🔐 Vérification permissions:', {
      userId: user.userId,
      commentUserId: existingComment.user_id,
      isOwner,
      isAdmin,
      userRole: user.role,
      userIsAdmin: user.isAdmin
    });

    if (!isOwner && !isAdmin) {
      return Response.json(
        { error: 'Vous n\'avez pas la permission de modifier ce commentaire' },
        { status: 403 }
      );
    }

    // Mettre à jour le commentaire
    await query(
      `UPDATE comments 
       SET contenu = $1, updated_at = NOW()
       WHERE id = $2`,
      [contenu.trim(), commentId]
    );

    // Récupérer le commentaire mis à jour
    const updatedResult = await query(
      `SELECT 
        c.*,
        u.id as user_id,
        u.prenom as user_prenom,
        u.nom as user_nom,
        u.email as user_email,
        u.photo as user_photo
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [commentId]
    );

    const row = updatedResult.rows[0];
    const comment = {
      id: row.id,
      article_id: row.article_id,
      user_id: row.user_id,
      contenu: row.contenu,
      created_at: row.created_at,
      updated_at: row.updated_at,
      users: {
        id: row.user_id,
        prenom: row.user_prenom,
        nom: row.user_nom,
        email: row.user_email,
        photo_profil: row.user_photo
      }
    };

    console.log('✅ Commentaire modifié par:', isAdmin ? 'Admin' : 'Propriétaire');

    return Response.json(
      { 
        message: 'Commentaire modifié avec succès',
        comment 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur serveur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la modification du commentaire' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un commentaire
export async function DELETE(request, context) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return Response.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Récupérer le commentaire existant
    const existingResult = await query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    );

    if (existingResult.rows.length === 0) {
      return Response.json(
        { error: 'Commentaire introuvable' },
        { status: 404 }
      );
    }

    const existingComment = existingResult.rows[0];

    // Vérifier les permissions
    const isOwner = existingComment.user_id === user.userId;
    const isAdmin = user.isAdmin === true || user.role === 'Administrateur';

    console.log('🔐 Vérification permissions suppression:', {
      userId: user.userId,
      commentUserId: existingComment.user_id,
      isOwner,
      isAdmin,
      userRole: user.role
    });

    if (!isOwner && !isAdmin) {
      return Response.json(
        { error: 'Vous n\'avez pas la permission de supprimer ce commentaire' },
        { status: 403 }
      );
    }

    // Supprimer le commentaire
    await query(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    );

    console.log('✅ Commentaire supprimé par:', isAdmin ? 'Admin' : 'Propriétaire');

    return Response.json(
      { message: 'Commentaire supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur serveur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la suppression du commentaire' },
      { status: 500 }
    );
  }
}