// src/app/api/actualites/[id]/route.js - CORRECTION MYSQL2
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

    const query = `
      SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = ${id}
    `;

    const [rows] = await db.query(query);

    if (rows.length === 0) {
      return Response.json(
        { error: 'Actualité non trouvée' },
        { status: 404 }
      );
    }

    const row = rows[0];
    
    // Gestion sécurisée des tags JSON
    let tags = [];
    if (row.tags) {
      try {
        tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
      } catch (e) {
        console.warn('Erreur parsing tags pour actualité', row.id, ':', e);
        tags = [];
      }
    }
    
    // Formatage cohérent avec le frontend
    const actualite = {
      id: row.id,
      titre: row.titre,
      title: row.titre, // Alias pour compatibilité
      description: row.description,
      contenu: row.contenu,
      content: row.contenu, // Alias pour compatibilité
      type: row.type,
      statut: row.statut,
      status: row.statut, // Alias pour compatibilité
      image: row.image || '/images/actualites/default.jpg',
      date_creation: row.date_creation,
      date: row.date_creation ? new Date(row.date_creation).toLocaleDateString('fr-FR') : '',
      date_publication: row.date_publication,
      date_modification: row.date_modification,
      updatedDate: row.date_modification ? new Date(row.date_modification).toLocaleDateString('fr-FR') : null,
      tags: tags,
      lieu: row.lieu || '',
      location: row.lieu || '', // Alias pour compatibilité
      places_disponibles: row.places_disponibles || null,
      places: row.places_disponibles || null, // Alias pour compatibilité
      inscription_requise: Boolean(row.inscription_requise),
      hasRegistration: Boolean(row.inscription_requise), // Alias pour compatibilité
      auteur: {
        id: row.auteur_id,
        prenom: row.auteur_prenom,
        firstName: row.auteur_prenom, // Alias pour compatibilité
        nom: row.auteur_nom,
        lastName: row.auteur_nom, // Alias pour compatibilité
        photo: row.auteur_photo || '/images/default-avatar.jpg',
        bio: row.auteur_bio || ''
      },
      author: { // Alias pour compatibilité
        firstName: row.auteur_prenom,
        lastName: row.auteur_nom
      }
    };

    return Response.json(actualite);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'actualité:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération de l\'actualité',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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
    const checkQuery = `SELECT id, statut FROM actualites WHERE id = ${id}`;
    const [existingActualite] = await db.query(checkQuery);

    if (existingActualite.length === 0) {
      return Response.json(
        { error: 'Actualité non trouvée' },
        { status: 404 }
      );
    }

    // Validation du type si fourni
    if (type) {
      const typesAutorises = ['événement', 'témoignage', 'numérique', 'administratif', 'soutien', 'bien-être', 'junior'];
      if (!typesAutorises.includes(type)) {
        return Response.json(
          { error: 'Type d\'actualité non valide' },
          { status: 400 }
        );
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];

    if (titre !== undefined) {
      updates.push(`titre = ${db.escape(titre.trim())}`);
    }
    if (description !== undefined) {
      updates.push(`description = ${db.escape(description.trim())}`);
    }
    if (contenu !== undefined) {
      updates.push(`contenu = ${db.escape(contenu.trim())}`);
    }
    if (type !== undefined) {
      updates.push(`type = ${db.escape(type)}`);
    }
    if (statut !== undefined) {
      updates.push(`statut = ${db.escape(statut)}`);
      
      // Gestion de la date de publication
      if (statut === 'Publié' && existingActualite[0].statut !== 'Publié') {
        if (date_publication) {
          try {
            const dateObj = new Date(date_publication);
            if (!isNaN(dateObj.getTime())) {
              updates.push(`date_publication = ${db.escape(dateObj.toISOString().slice(0, 19).replace('T', ' '))}`);
            } else {
              updates.push(`date_publication = ${db.escape(new Date().toISOString().slice(0, 19).replace('T', ' '))}`);
            }
          } catch (e) {
            updates.push(`date_publication = ${db.escape(new Date().toISOString().slice(0, 19).replace('T', ' '))}`);
          }
        } else {
          updates.push(`date_publication = ${db.escape(new Date().toISOString().slice(0, 19).replace('T', ' '))}`);
        }
      }
    }
    if (image !== undefined) {
      updates.push(`image = ${image && image.trim() !== '' ? db.escape(image.trim()) : 'NULL'}`);
    }
    if (tags !== undefined) {
      const tagsJson = tags && Array.isArray(tags) && tags.length > 0 ? JSON.stringify(tags) : null;
      updates.push(`tags = ${tagsJson ? db.escape(tagsJson) : 'NULL'}`);
    }
    if (lieu !== undefined) {
      updates.push(`lieu = ${lieu && lieu.trim() !== '' ? db.escape(lieu.trim()) : 'NULL'}`);
    }
    if (places_disponibles !== undefined) {
      const placesNum = parseInt(places_disponibles, 10);
      updates.push(`places_disponibles = ${!isNaN(placesNum) && placesNum > 0 ? placesNum : 'NULL'}`);
    }
    if (inscription_requise !== undefined) {
      updates.push(`inscription_requise = ${Boolean(inscription_requise) ? 1 : 0}`);
    }

    // Toujours mettre à jour la date de modification
    updates.push('date_modification = NOW()');

    if (updates.length === 1) { // Seulement date_modification
      return Response.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    const updateQuery = `UPDATE actualites SET ${updates.join(', ')} WHERE id = ${id}`;
    console.log('Requête de mise à jour:', updateQuery);

    await db.query(updateQuery);

    // Récupérer l'actualité mise à jour
    const selectQuery = `
      SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = ${id}
    `;

    const [updatedActualite] = await db.query(selectQuery);

    const actualiteUpdated = {
      id: updatedActualite[0].id,
      titre: updatedActualite[0].titre,
      description: updatedActualite[0].description,
      contenu: updatedActualite[0].contenu,
      type: updatedActualite[0].type,
      statut: updatedActualite[0].statut,
      image: updatedActualite[0].image || '/images/actualites/default.jpg',
      date_creation: updatedActualite[0].date_creation,
      date_publication: updatedActualite[0].date_publication,
      date_modification: updatedActualite[0].date_modification,
      tags: updatedActualite[0].tags ? JSON.parse(updatedActualite[0].tags) : [],
      lieu: updatedActualite[0].lieu,
      places_disponibles: updatedActualite[0].places_disponibles,
      inscription_requise: Boolean(updatedActualite[0].inscription_requise),
      auteur: {
        id: updatedActualite[0].auteur_id,
        prenom: updatedActualite[0].auteur_prenom,
        nom: updatedActualite[0].auteur_nom,
        photo: updatedActualite[0].auteur_photo || '/images/default-avatar.jpg',
        bio: updatedActualite[0].auteur_bio || ''
      }
    };

    return Response.json({
      message: 'Actualité mise à jour avec succès',
      actualite: actualiteUpdated
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'actualité:', error);
    
    let errorMessage = 'Erreur serveur lors de la mise à jour de l\'actualité';
    let statusCode = 500;
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Erreur de structure de base de données';
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
    const checkQuery = `SELECT id FROM actualites WHERE id = ${id}`;
    const [existingActualite] = await db.query(checkQuery);

    if (existingActualite.length === 0) {
      return Response.json(
        { error: 'Actualité non trouvée' },
        { status: 404 }
      );
    }

    const deleteQuery = `DELETE FROM actualites WHERE id = ${id}`;
    await db.query(deleteQuery);

    return Response.json({
      message: 'Actualité supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'actualité:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la suppression de l\'actualité',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}