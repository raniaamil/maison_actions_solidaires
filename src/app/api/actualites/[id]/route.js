// src/app/api/actualites/[id]/route.js - VERSION POSTGRESQL CORRIGÉE
export const runtime = 'nodejs';
import { query } from '../../../../lib/db';

// ✅ Helper : parse tags JSONB proprement
function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (typeof raw === 'object') return raw;
  return [];
}

// GET - Récupérer une actualité par ID
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return Response.json({ error: 'ID invalide' }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        a.*,
        COALESCE(u.prenom, 'Auteur') as auteur_prenom,
        COALESCE(u.nom, 'supprimé') as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      LEFT JOIN users u ON a.auteur_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Actualité non trouvée' }, { status: 404 });
    }

    const row = result.rows[0];
    const tags = parseTags(row.tags);
    
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
      image: row.image || '/images/actualites/default.jpg',
      date_creation: row.date_creation,
      date: row.date_creation ? new Date(row.date_creation).toLocaleDateString('fr-FR') : '',
      date_publication: row.date_publication,
      date_modification: row.date_modification,
      updatedDate: row.date_modification ? new Date(row.date_modification).toLocaleDateString('fr-FR') : null,
      tags,
      lieu: row.lieu || '',
      location: row.lieu || '',
      places_disponibles: row.places_disponibles || null,
      places: row.places_disponibles || null,
      inscription_requise: Boolean(row.inscription_requise),
      hasRegistration: Boolean(row.inscription_requise),
      auteur: {
        id: row.auteur_id,
        prenom: row.auteur_prenom,
        firstName: row.auteur_prenom,
        nom: row.auteur_nom,
        lastName: row.auteur_nom,
        photo: row.auteur_photo || '/images/default-avatar.jpg',
        bio: row.auteur_bio || ''
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
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await request.json();

    if (isNaN(id)) {
      return Response.json({ error: 'ID invalide' }, { status: 400 });
    }

    const {
      titre, description, contenu, type, statut, image,
      date_publication, tags, lieu, places_disponibles, inscription_requise
    } = body;

    // Vérifier que l'actualité existe
    const checkResult = await query('SELECT id, statut FROM actualites WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return Response.json({ error: 'Actualité non trouvée' }, { status: 404 });
    }

    const existingActualite = checkResult.rows[0];

    // Validation du type si fourni
    if (type) {
      const typesAutorises = ['événement', 'témoignage', 'numérique', 'administratif', 'soutien', 'bien-être', 'junior'];
      if (!typesAutorises.includes(type)) {
        return Response.json({ error: 'Type d\'actualité non valide' }, { status: 400 });
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const queryParams = [];
    let paramIndex = 1;

    if (titre !== undefined) {
      updates.push(`titre = $${paramIndex}`);
      queryParams.push(titre.trim());
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      queryParams.push(description.trim());
      paramIndex++;
    }
    if (contenu !== undefined) {
      updates.push(`contenu = $${paramIndex}`);
      queryParams.push(contenu.trim());
      paramIndex++;
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }
    if (statut !== undefined) {
      updates.push(`statut = $${paramIndex}`);
      queryParams.push(statut);
      paramIndex++;
    }
    
    // Gestion de la date de publication
    if (statut === 'Publié' && existingActualite.statut !== 'Publié') {
      let datePublicationValue = new Date();
      if (date_publication) {
        try {
          const dateObj = new Date(date_publication);
          if (!isNaN(dateObj.getTime())) datePublicationValue = dateObj;
        } catch { /* garder la date par défaut */ }
      }
      updates.push(`date_publication = $${paramIndex}`);
      queryParams.push(datePublicationValue);
      paramIndex++;
    }

    if (image !== undefined) {
      updates.push(`image = $${paramIndex}`);
      queryParams.push(image && image.trim() !== '' ? image.trim() : null);
      paramIndex++;
    }

    if (tags !== undefined) {
      // ✅ CORRIGÉ : Pour JSONB, on passe JSON.stringify (pg l'accepte comme text pour JSONB)
      const tagsValue = tags && Array.isArray(tags) && tags.length > 0 ? JSON.stringify(tags) : null;
      updates.push(`tags = $${paramIndex}`);
      queryParams.push(tagsValue);
      paramIndex++;
    }

    if (lieu !== undefined) {
      updates.push(`lieu = $${paramIndex}`);
      queryParams.push(lieu && lieu.trim() !== '' ? lieu.trim() : null);
      paramIndex++;
    }

    if (places_disponibles !== undefined) {
      let placesValue = null;
      const placesNum = parseInt(places_disponibles, 10);
      if (!isNaN(placesNum) && placesNum > 0) placesValue = placesNum;
      updates.push(`places_disponibles = $${paramIndex}`);
      queryParams.push(placesValue);
      paramIndex++;
    }

    if (inscription_requise !== undefined) {
      updates.push(`inscription_requise = $${paramIndex}`);
      queryParams.push(Boolean(inscription_requise));
      paramIndex++;
    }

    // Toujours mettre à jour la date de modification
    updates.push(`date_modification = NOW()`);

    if (updates.length === 1) {
      return Response.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    queryParams.push(id);
    const updateQuery = `UPDATE actualites SET ${updates.join(', ')} WHERE id = $${queryParams.length}`;
    
    await query(updateQuery, queryParams);

    // Récupérer l'actualité mise à jour
    const selectResult = await query(`
      SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = $1
    `, [id]);

    const updatedActualite = selectResult.rows[0];

    const actualiteUpdated = {
      id: updatedActualite.id,
      titre: updatedActualite.titre,
      description: updatedActualite.description,
      contenu: updatedActualite.contenu,
      type: updatedActualite.type,
      statut: updatedActualite.statut,
      image: updatedActualite.image || '/images/actualites/default.jpg',
      date_creation: updatedActualite.date_creation,
      date_publication: updatedActualite.date_publication,
      date_modification: updatedActualite.date_modification,
      tags: parseTags(updatedActualite.tags),
      lieu: updatedActualite.lieu,
      places_disponibles: updatedActualite.places_disponibles,
      inscription_requise: Boolean(updatedActualite.inscription_requise),
      auteur: {
        id: updatedActualite.auteur_id,
        prenom: updatedActualite.auteur_prenom,
        nom: updatedActualite.auteur_nom,
        photo: updatedActualite.auteur_photo || '/images/default-avatar.jpg',
        bio: updatedActualite.auteur_bio || ''
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
    
    if (error.code === '22001') {
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    } else if (error.code === '42703') {
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
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return Response.json({ error: 'ID invalide' }, { status: 400 });
    }

    const checkResult = await query('SELECT id FROM actualites WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return Response.json({ error: 'Actualité non trouvée' }, { status: 404 });
    }

    await query('DELETE FROM actualites WHERE id = $1', [id]);

    return Response.json({ message: 'Actualité supprimée avec succès' });
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