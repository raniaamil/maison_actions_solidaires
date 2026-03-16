// src/app/api/actualites/route.js - VERSION POSTGRESQL
export const runtime = 'nodejs';
import { query } from '../../../lib/db';

// GET - Récupérer toutes les actualités
export async function GET(request) {
  try {
    console.log('🔄 Début de la récupération des actualités');
    
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const auteur_id = searchParams.get('auteur_id');
    
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const limit = limitParam ? Math.max(1, Math.min(1000, parseInt(limitParam, 10))) : 50;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    // Construction dynamique de la requête avec paramètres PostgreSQL
    let queryText = `
      SELECT 
        a.id,
        a.titre,
        a.description,
        a.contenu,
        a.type,
        a.statut,
        a.image,
        a.date_creation,
        a.date_publication,
        a.date_modification,
        a.lieu,
        a.places_disponibles,
        a.inscription_requise,
        a.auteur_id,
        a.tags,
        COALESCE(u.prenom, 'Auteur') as auteur_prenom,
        COALESCE(u.nom, 'supprimé') as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      LEFT JOIN users u ON a.auteur_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (statut && typeof statut === 'string' && statut.trim() !== '') {
      queryText += ` AND a.statut = $${paramIndex}`;
      queryParams.push(statut.trim());
      paramIndex++;
    }

    if (type && typeof type === 'string' && type.trim() !== '') {
      queryText += ` AND a.type = $${paramIndex}`;
      queryParams.push(type.trim());
      paramIndex++;
    }

    if (auteur_id && auteur_id.trim() !== '') {
      const auteurIdNum = parseInt(auteur_id, 10);
      if (!isNaN(auteurIdNum) && auteurIdNum > 0) {
        queryText += ` AND a.auteur_id = $${paramIndex}`;
        queryParams.push(auteurIdNum);
        paramIndex++;
      }
    }

    queryText += ` ORDER BY a.date_creation DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);
    const rows = result.rows;

    console.log(`✅ ${rows.length} actualités trouvées`);

    // Transformer les données pour correspondre au format attendu par le frontend
    const actualites = rows.map(row => {
      // ✅ CORRIGÉ : Gestion propre des tags JSONB
      // Avec pg + JSONB, row.tags est déjà un objet JS (array ou null)
      // Pas besoin de JSON.parse sauf si les données ont été mal stockées avant
      let tags = [];
      if (row.tags) {
        if (Array.isArray(row.tags)) {
          tags = row.tags;
        } else if (typeof row.tags === 'string') {
          try { tags = JSON.parse(row.tags); } catch { tags = []; }
        } else if (typeof row.tags === 'object') {
          tags = row.tags;
        }
      }

      return {
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
        tags: tags,
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
    });

    return Response.json(actualites);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actualités:', error);
    
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des actualités',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code
        } : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle actualité
export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      titre,
      description,
      contenu,
      type,
      statut = 'Brouillon',
      image,
      auteur_id,
      date_publication,
      tags,
      lieu,
      places_disponibles,
      inscription_requise = false
    } = body;

    // Validation des champs requis
    if (!titre || !description || !contenu || !type || !auteur_id) {
      return Response.json(
        { error: 'Les champs titre, description, contenu, type et auteur_id sont requis' },
        { status: 400 }
      );
    }

    // Validation des types autorisés
    const typesAutorises = ['événement', 'témoignage', 'numérique', 'administratif', 'soutien', 'bien-être', 'junior'];
    if (!typesAutorises.includes(type)) {
      return Response.json(
        { error: 'Type d\'actualité non valide' },
        { status: 400 }
      );
    }

    const auteurIdNum = parseInt(auteur_id, 10);
    if (isNaN(auteurIdNum) || auteurIdNum <= 0) {
      return Response.json(
        { error: 'ID auteur invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'auteur existe
    const checkAuteurResult = await query(
      'SELECT id, prenom, nom FROM users WHERE id = $1 AND actif = true',
      [auteurIdNum]
    );

    if (checkAuteurResult.rows.length === 0) {
      return Response.json(
        { error: 'Auteur non trouvé ou inactif' },
        { status: 404 }
      );
    }

    // ✅ CORRIGÉ : Pour JSONB, passer l'objet JS directement (pas JSON.stringify)
    // pg sérialise automatiquement les objets JS en JSONB
    const tagsValue = tags && Array.isArray(tags) && tags.length > 0 ? JSON.stringify(tags) : null;
    
    let placesValue = null;
    if (places_disponibles !== null && places_disponibles !== undefined && places_disponibles !== '') {
      const placesNum = parseInt(places_disponibles, 10);
      if (!isNaN(placesNum) && placesNum > 0) {
        placesValue = placesNum;
      }
    }
    
    // Gestion de la date de publication
    let datePublicationValue = null;
    if (statut === 'Publié') {
      if (date_publication) {
        try {
          const dateObj = new Date(date_publication);
          if (!isNaN(dateObj.getTime())) {
            datePublicationValue = dateObj;
          } else {
            datePublicationValue = new Date();
          }
        } catch {
          datePublicationValue = new Date();
        }
      } else {
        datePublicationValue = new Date();
      }
    }

    const insertResult = await query(`
      INSERT INTO actualites (
        titre, description, contenu, type, statut, image, auteur_id, 
        date_publication, tags, lieu, places_disponibles, inscription_requise
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id
    `, [
      titre.trim(),
      description.trim(),
      contenu.trim(),
      type,
      statut,
      image && image.trim() !== '' ? image.trim() : null,
      auteurIdNum,
      datePublicationValue,
      tagsValue,
      lieu && lieu.trim() !== '' ? lieu.trim() : null,
      placesValue,
      inscription_requise
    ]);

    const newId = insertResult.rows[0].id;

    // Récupérer l'actualité créée
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
    `, [newId]);

    if (selectResult.rows.length === 0) {
      return Response.json(
        { error: 'Actualité créée mais impossible de la récupérer' },
        { status: 500 }
      );
    }

    const newActualite = selectResult.rows[0];

    // ✅ CORRIGÉ : Gestion propre des tags JSONB
    let parsedTags = [];
    if (newActualite.tags) {
      if (Array.isArray(newActualite.tags)) {
        parsedTags = newActualite.tags;
      } else if (typeof newActualite.tags === 'string') {
        try { parsedTags = JSON.parse(newActualite.tags); } catch { parsedTags = []; }
      }
    }

    const actualiteCreee = {
      id: newActualite.id,
      titre: newActualite.titre,
      description: newActualite.description,
      contenu: newActualite.contenu,
      type: newActualite.type,
      statut: newActualite.statut,
      image: newActualite.image || '/images/actualites/default.jpg',
      date_creation: newActualite.date_creation,
      date_publication: newActualite.date_publication,
      date_modification: newActualite.date_modification,
      tags: parsedTags,
      lieu: newActualite.lieu,
      places_disponibles: newActualite.places_disponibles,
      inscription_requise: Boolean(newActualite.inscription_requise),
      auteur: {
        id: newActualite.auteur_id,
        prenom: newActualite.auteur_prenom,
        nom: newActualite.auteur_nom,
        photo: newActualite.auteur_photo || '/images/default-avatar.jpg',
        bio: newActualite.auteur_bio || ''
      }
    };

    return Response.json(
      {
        message: 'Actualité créée avec succès',
        actualite: actualiteCreee
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'actualité:', error);
    
    let errorMessage = 'Erreur serveur lors de la création de l\'actualité';
    let statusCode = 500;
    
    if (error.code === '42P01') {
      errorMessage = 'Table actualites non trouvée dans la base de données';
    } else if (error.code === '42703') {
      errorMessage = 'Erreur de structure de base de données';
    } else if (error.code === '23503') {
      errorMessage = 'Référence auteur invalide';
      statusCode = 400;
    } else if (error.code === '22001') {
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    }
    
    return Response.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code
        } : undefined
      },
      { status: statusCode }
    );
  }
}