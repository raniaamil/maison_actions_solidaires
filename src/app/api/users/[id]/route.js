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
      photo: rows[0].photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: rows[0].bio || '',
      role: rows[0].role,
      date_inscription: rows[0].date_inscription,
      date_modification: rows[0].date_modification,
      actif: rows[0].actif
    };

    return Response.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération de l\'utilisateur' },
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

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (prenom !== undefined) {
      updates.push('prenom = ?');
      params.push(prenom.trim());
    }
    if (nom !== undefined) {
      updates.push('nom = ?');
      params.push(nom.trim());
    }
    if (email !== undefined) {
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

      updates.push('email = ?');
      params.push(email.toLowerCase().trim());
    }
    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(photo);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (actif !== undefined) {
      updates.push('actif = ?');
      params.push(actif);
    }

    // Gestion du mot de passe
    if (password && password.trim()) {
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

    if (updates.length === 0) {
      return Response.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    params.push(id);

    await db.execute(
      `UPDATE users SET ${updates.join(', ')}, date_modification = NOW() WHERE id = ?`,
      params
    );

    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await db.execute(
      `SELECT 
        id, prenom, nom, email, photo, bio, role, 
        date_inscription, date_modification, actif
      FROM users 
      WHERE id = ?`,
      [id]
    );

    return Response.json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: updatedUser[0].id,
        prenom: updatedUser[0].prenom,
        nom: updatedUser[0].nom,
        email: updatedUser[0].email,
        photo: updatedUser[0].photo,
        bio: updatedUser[0].bio,
        role: updatedUser[0].role,
        date_inscription: updatedUser[0].date_inscription,
        date_modification: updatedUser[0].date_modification,
        actif: updatedUser[0].actif
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
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
      'SELECT id FROM users WHERE id = ? AND actif = TRUE',
      [id]
    );

    if (existingUser.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
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
      { error: 'Erreur serveur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}