// src/app/api/users/[id]/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';
import bcrypt from 'bcryptjs';

// GET - Récupérer un utilisateur par ID
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      `SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE id = ? AND actif = TRUE`,
      [id]
    );

    if (rows.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const user = {
      id: rows[0].id,
      prenom: rows[0].prenom,
      nom: rows[0].nom,
      email: rows[0].email,
      photo: rows[0].photo || '/images/default-avatar.jpg',
      bio: rows[0].bio || '',
      role: rows[0].role,
      date_inscription: rows[0].date_inscription,
      date_modification: rows[0].date_modification,
      actif: Boolean(rows[0].actif)
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
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
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
    const [existingUser] = await db.execute(
      'SELECT id, email FROM users WHERE id = ? AND actif = TRUE',
      [id]
    );

    if (existingUser.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

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
      if (email.toLowerCase().trim() !== existingUser[0].email) {
        const [emailCheck] = await db.execute(
          'SELECT id FROM users WHERE email = ? AND id != ? AND actif = TRUE',
          [email.toLowerCase().trim(), id]
        );

        if (emailCheck.length > 0) {
          return Response.json(
            { error: 'Cette adresse e-mail est déjà utilisée' },
            { status: 409 }
          );
        }
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (prenom !== undefined && prenom.trim() !== '') {
      updates.push('prenom = ?');
      params.push(prenom.trim());
    }
    if (nom !== undefined && nom.trim() !== '') {
      updates.push('nom = ?');
      params.push(nom.trim());
    }
    if (email !== undefined && email.trim() !== '') {
      updates.push('email = ?');
      params.push(email.toLowerCase().trim());
    }
    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(photo && photo.trim() !== '' ? photo.trim() : null);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio && bio.trim() !== '' ? bio.trim() : null);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (actif !== undefined) {
      updates.push('actif = ?');
      params.push(Boolean(actif));
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
      updates.push('mot_de_passe = ?');
      params.push(hashedPassword);
    }

    // Toujours mettre à jour la date de modification
    updates.push('date_modification = NOW()');

    if (updates.length === 1) { // Seulement date_modification
      return Response.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    params.push(id);

    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Récupérer l'utilisateur mis à jour (sans le mot de passe)
    const [updatedUser] = await db.execute(
      `SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE id = ?`,
      [id]
    );

    const userUpdated = {
      id: updatedUser[0].id,
      prenom: updatedUser[0].prenom,
      nom: updatedUser[0].nom,
      email: updatedUser[0].email,
      photo: updatedUser[0].photo || '/images/default-avatar.jpg',
      bio: updatedUser[0].bio || '',
      role: updatedUser[0].role,
      date_inscription: updatedUser[0].date_inscription,
      date_modification: updatedUser[0].date_modification,
      actif: Boolean(updatedUser[0].actif)
    };

    return Response.json({
      message: 'Utilisateur mis à jour avec succès',
      user: userUpdated
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    let errorMessage = 'Erreur serveur lors de la mise à jour de l\'utilisateur';
    let statusCode = 500;
    
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Cette adresse e-mail est déjà utilisée';
      statusCode = 409;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
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
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const [existingUser] = await db.execute(
      'SELECT id, role FROM users WHERE id = ? AND actif = TRUE',
      [id]
    );

    if (existingUser.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher la suppression si c'est le dernier administrateur
    if (existingUser[0].role === 'Administrateur') {
      const [adminCount] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND actif = TRUE',
        ['Administrateur']
      );

      if (adminCount[0].count <= 1) {
        return Response.json(
          { error: 'Impossible de supprimer le dernier administrateur' },
          { status: 400 }
        );
      }
    }

    // Suppression logique : marquer comme inactif
    await db.execute(
      'UPDATE users SET actif = FALSE, date_modification = NOW() WHERE id = ?',
      [id]
    );

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