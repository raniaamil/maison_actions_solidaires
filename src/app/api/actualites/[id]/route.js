// src/app/api/actualites/[id]/route.js
export const runtime = 'nodejs';
import db from '../../../../lib/db';

// GET - Récupérer une actualité par ID
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
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return Response.json(
        { error: 'Actualité non trouvée' },
        { status: 404 }
      );
    }

    const row = rows[0];
    const actualite = {
      id: row.id,
      titre: row.titre,
      title: row.titre,
      description: row.description,
      contenu: row.contenu,
      content: row.contenu,
      type: row.type,
      statut: row.statut,
      status: row.statut,
      image: row.image,
      date_creation: row.date_creation,
      date: new Date(row.date_creation).toLocaleDateString('fr-FR'),
      date_publication: row.date_publication,
      date_modification: row.date_modification,
      updatedDate: row.date_modification ? new Date(row.date_modification).toLocaleDateString('fr-FR') : null,
      tags: row.tags ? JSON.parse(row.tags) : [],
      lieu: row.lieu,
      location: row.lieu,
      places_disponibles: row.places_disponibles,
      places: row.places_disponibles,
      inscription_requise: row.inscription_requise,
      hasRegistration: row.inscription_requise,
      auteur: {
        id: row.auteur_id,
        prenom: row.auteur_prenom,
        firstName: row.auteur_prenom,
        nom: row.auteur_nom,
        lastName: row.auteur_nom,
        photo: row.auteur_photo,
        bio: row.auteur_bio
      },
      author: {
        firstName: row.auteur_prenom,
        lastName: row.auteur_nom
      }
    };

    return Response.json(actualite);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'actualité:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération de l\'actualité' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une actualité
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
      titre,
      description,
      contenu,
      type,
      statut,
      image,
      date_publication,
      tags,
      lieu,
      places_disponibles,
      inscription_requise
    } = body;

    // Vérifier que l'actualité existe
    const [existingActualite] = await db.execute(
      'SELECT id, statut FROM actualites WHERE id = ?',
      [id]
    );

    if (existingActualite.length === 0) {
      return Response.json(
        { error: 'Actualité non trouvée' },
        { status: 404 }
      );
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (titre !== undefined) {
      updates.push('titre = ?');
      params.push(titre);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (contenu !== undefined) {
      updates.push('contenu = ?');
      params.push(contenu);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (statut !== undefined) {
      updates.push('statut = ?');
      params.push(statut);
      
      // Si on publie pour la première fois
      if (statut === 'Publié' && existingActualite[0].statut !== 'Publié') {
        updates.push('date_publication = ?');
        params.push(date_publication || new Date());
      }
    }
    if (image !== undefined) {
      updates.push('image = ?');
      params.push(image);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(tags ? JSON.stringify(tags) : null);
    }
    if (lieu !== undefined) {
      updates.push('lieu = ?');
      params.push(lieu);
    }
    if (places_disponibles !== undefined) {
      updates.push('places_disponibles = ?');
      params.push(places_disponibles);
    }
    if (inscription_requise !== undefined) {
      updates.push('inscription_requise = ?');
      params.push(inscription_requise);
    }

    if (updates.length === 0) {
      return Response.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    params.push(id);

    await db.execute(
      `UPDATE actualites SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Récupérer l'actualité mise à jour
    const [updatedActualite] = await db.execute(
      `SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    return Response.json({
      message: 'Actualité mise à jour avec succès',
      actualite: {
        id: updatedActualite[0].id,
        titre: updatedActualite[0].titre,
        description: updatedActualite[0].description,
        contenu: updatedActualite[0].contenu,
        type: updatedActualite[0].type,
        statut: updatedActualite[0].statut,
        image: updatedActualite[0].image,
        date_creation: updatedActualite[0].date_creation,
        date_publication: updatedActualite[0].date_publication,
        date_modification: updatedActualite[0].date_modification,
        auteur: {
          id: updatedActualite[0].auteur_id,
          prenom: updatedActualite[0].auteur_prenom,
          nom: updatedActualite[0].auteur_nom,
          photo: updatedActualite[0].auteur_photo,
          bio: updatedActualite[0].auteur_bio
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'actualité:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la mise à jour de l\'actualité' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une actualité
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return Response.json(
        { error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'actualité existe
    const [existingActualite] = await db.execute(
      'SELECT id FROM actualites WHERE id = ?',
      [id]
    );

    if (existingActualite.length === 0) {
      return Response.json(
        { error: 'Actualité non trouvée' },
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM actualites WHERE id = ?', [id]);

    return Response.json({
      message: 'Actualité supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'actualité:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la suppression de l\'actualité' },
      { status: 500 }
    );
  }
}