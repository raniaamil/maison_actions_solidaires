// src/app/api/users/[id]/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Récupérer un utilisateur par ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const result = await db.query(
      `SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE id = $1 AND actif = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const userData = result.rows[0];
    const user = {
      id: userData.id,
      prenom: userData.prenom,
      nom: userData.nom,
      email: userData.email,
      photo: userData.photo || '/images/default-avatar.jpg',
      bio: userData.bio || '',
      role: userData.role,
      date_inscription: userData.date_inscription,
      date_modification: userData.date_modification,
      actif: Boolean(userData.actif)
    };

    return Response.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération de l\'utilisateur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();

    if (isNaN(userId)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const {
      prenom,
      nom,
      email,
      photo,
      bio,
      role,
      password,
      actif
    } = body;

    // Vérifier que l'utilisateur existe
    const existingResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1 AND actif = TRUE',
      [userId]
    );

    if (existingResult.rows.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const existingUser = existingResult.rows[0];

    // Validation du rôle si fourni
    if (role) {
      const rolesAutorises = ['Administrateur', 'Rédacteur'];
      if (!rolesAutorises.includes(role)) {
        return Response.json(
          { error: 'Rôle non valide' },
          { status: 400 }
        );
      }
    }

    // Validation de l'email si fourni
    if (email && email.trim() !== '') {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email.trim())) {
        return Response.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        );
      }

      // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
      if (email.toLowerCase().trim() !== existingUser.email) {
        const emailCheckResult = await db.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2 AND actif = TRUE',
          [email.toLowerCase().trim(), userId]
        );

        if (emailCheckResult.rows.length > 0) {
          return Response.json(
            { error: 'Cette adresse e-mail est déjà utilisée' },
            { status: 409 }
          );
        }
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const updateParams = [];
    let paramIndex = 1;

    if (prenom !== undefined && prenom.trim() !== '') {
      updates.push(`prenom = $${paramIndex}`);
      updateParams.push(prenom.trim());
      paramIndex++;
    }
    if (nom !== undefined && nom.trim() !== '') {
      updates.push(`nom = $${paramIndex}`);
      updateParams.push(nom.trim());
      paramIndex++;
    }
    if (email !== undefined && email.trim() !== '') {
      updates.push(`email = $${paramIndex}`);
      updateParams.push(email.toLowerCase().trim());
      paramIndex++;
    }
    if (photo !== undefined) {
      updates.push(`photo = $${paramIndex}`);
      updateParams.push(photo && photo.trim() !== '' ? photo.trim() : null);
      paramIndex++;
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex}`);
      updateParams.push(bio && bio.trim() !== '' ? bio.trim() : null);
      paramIndex++;
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      updateParams.push(role);
      paramIndex++;
    }
    if (actif !== undefined) {
      updates.push(`actif = $${paramIndex}`);
      updateParams.push(Boolean(actif));
      paramIndex++;
    }

    // Gestion du mot de passe
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return Response.json(
          { error: 'Le mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      updates.push(`mot_de_passe = $${paramIndex}`);
      updateParams.push(hashedPassword);
      paramIndex++;
    }

    // Toujours mettre à jour la date de modification
    updates.push(`date_modification = CURRENT_TIMESTAMP`);

    if (updates.length === 1) { // Seulement date_modification
      return Response.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    // Ajouter l'ID utilisateur à la fin
    updateParams.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      updateParams
    );

    // Récupérer l'utilisateur mis à jour (sans le mot de passe)
    const updatedResult = await db.query(
      `SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    const updatedUserData = updatedResult.rows[0];
    const userUpdated = {
      id: updatedUserData.id,
      prenom: updatedUserData.prenom,
      nom: updatedUserData.nom,
      email: updatedUserData.email,
      photo: updatedUserData.photo || '/images/default-avatar.jpg',
      bio: updatedUserData.bio || '',
      role: updatedUserData.role,
      date_inscription: updatedUserData.date_inscription,
      date_modification: updatedUserData.date_modification,
      actif: Boolean(updatedUserData.actif)
    };

    return Response.json({
      message: 'Utilisateur mis à jour avec succès',
      user: userUpdated
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    let errorMessage = 'Erreur serveur lors de la mise à jour de l\'utilisateur';
    let statusCode = 500;
    
    if (error.code === '23505') { // unique_violation
      errorMessage = 'Cette adresse e-mail est déjà utilisée';
      statusCode = 409;
    } else if (error.code === '22001') { // string_data_right_truncation
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    } else if (error.code === '23502') { // not_null_violation
      errorMessage = 'Un champ obligatoire est manquant';
      statusCode = 400;
    }
    
    return Response.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

// DELETE - Supprimer un utilisateur (suppression logique)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingResult = await db.query(
      'SELECT id, role FROM users WHERE id = $1 AND actif = TRUE',
      [userId]
    );

    if (existingResult.rows.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const existingUser = existingResult.rows[0];

    // Empêcher la suppression si c'est le dernier administrateur
    if (existingUser.role === 'Administrateur') {
      const adminCountResult = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND actif = TRUE',
        ['Administrateur']
      );

      if (adminCountResult.rows[0].count <= 1) {
        return Response.json(
          { error: 'Impossible de supprimer le dernier administrateur' },
          { status: 400 }
        );
      }
    }

    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    return Response.json({
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la suppression de l\'utilisateur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}