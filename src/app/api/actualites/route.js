// src/app/api/actualites/route.js - CORRECTION MYSQL2/NEXT.JS
export const runtime = 'nodejs';
import db from '../../../lib/db';

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

    console.log('📊 Paramètres de recherche:', { statut, type, auteur_id, limit, offset });

    // Construction dynamique de la requête SANS paramètres préparés pour éviter les erreurs mysql2
    let query = `
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
        COALESCE(u.prenom, 'Auteur') as auteur_prenom,
        COALESCE(u.nom, 'supprimé') as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      LEFT JOIN users u ON a.auteur_id = u.id
      WHERE 1=1
    `;
    
    // Ajout des conditions avec échappement manuel pour éviter les problèmes mysql2
    if (statut && typeof statut === 'string' && statut.trim() !== '') {
      const statutEscaped = db.escape(statut.trim());
      query += ` AND a.statut = ${statutEscaped}`;
    }

    if (type && typeof type === 'string' && type.trim() !== '') {
      const typeEscaped = db.escape(type.trim());
      query += ` AND a.type = ${typeEscaped}`;
    }

    if (auteur_id && auteur_id.trim() !== '') {
      const auteurIdNum = parseInt(auteur_id, 10);
      if (!isNaN(auteurIdNum) && auteurIdNum > 0) {
        query += ` AND a.auteur_id = ${auteurIdNum}`;
      }
    }

    query += ` ORDER BY a.date_creation DESC LIMIT ${limit} OFFSET ${offset}`;

    console.log('🗄️ Requête SQL finale:', query);

    // Utilisation de query() au lieu de execute() pour éviter les problèmes de paramètres
    const [rows] = await db.query(query);

    console.log(`✅ ${rows.length} actualités trouvées dans la base de données`);

    // Log détaillé de la première actualité trouvée
    if (rows.length > 0) {
      console.log('📄 Première actualité brute:', {
        id: rows[0].id,
        titre: rows[0].titre,
        statut: rows[0].statut,
        type: rows[0].type,
        auteur_id: rows[0].auteur_id,
        date_creation: rows[0].date_creation
      });
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const actualites = rows.map(row => {
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
      
      return actualite;
    });

    console.log(`✅ ${actualites.length} actualités formatées pour le frontend`);

    if (actualites.length > 0) {
      console.log('📝 Première actualité formatée:', {
        id: actualites[0].id,
        titre: actualites[0].titre,
        statut: actualites[0].statut,
        type: actualites[0].type
      });
    }

    return Response.json(actualites);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actualités:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des actualités',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          code: error.code,
          sqlMessage: error.sqlMessage
        } : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle actualité
export async function POST(request) {
  try {
    console.log('🔄 Début de la création d\'une actualité');
    
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

    console.log('📝 Données reçues:', { titre, type, statut, auteur_id });

    // Validation des champs requis
    if (!titre || !description || !contenu || !type || !auteur_id) {
      console.log('❌ Champs manquants:', { 
        titre: !!titre, 
        description: !!description, 
        contenu: !!contenu, 
        type: !!type, 
        auteur_id: !!auteur_id 
      });
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

    // Conversion et validation de l'ID auteur
    const auteurIdNum = parseInt(auteur_id, 10);
    if (isNaN(auteurIdNum) || auteurIdNum <= 0) {
      return Response.json(
        { error: 'ID auteur invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'auteur existe avec une requête simple
    const checkAuteurQuery = `SELECT id, prenom, nom FROM users WHERE id = ${auteurIdNum} AND actif = TRUE`;
    const [auteurCheck] = await db.query(checkAuteurQuery);

    if (auteurCheck.length === 0) {
      return Response.json(
        { error: 'Auteur non trouvé ou inactif' },
        { status: 404 }
      );
    }

    // Préparation des données avec échappement sécurisé
    const titreEscaped = db.escape(titre.trim());
    const descriptionEscaped = db.escape(description.trim());
    const contenuEscaped = db.escape(contenu.trim());
    const typeEscaped = db.escape(type);
    const statutEscaped = db.escape(statut);
    const imageEscaped = image && image.trim() !== '' ? db.escape(image.trim()) : 'NULL';
    
    const tagsJson = tags && Array.isArray(tags) && tags.length > 0 ? JSON.stringify(tags) : null;
    const tagsEscaped = tagsJson ? db.escape(tagsJson) : 'NULL';
    
    const lieuEscaped = lieu && lieu.trim() !== '' ? db.escape(lieu.trim()) : 'NULL';
    
    let placesValue = 'NULL';
    if (places_disponibles !== null && places_disponibles !== undefined && places_disponibles !== '') {
      const placesNum = parseInt(places_disponibles, 10);
      if (!isNaN(placesNum) && placesNum > 0) {
        placesValue = placesNum;
      }
    }
    
    // Gestion de la date de publication
    let datePublicationEscaped = 'NULL';
    if (statut === 'Publié') {
      if (date_publication) {
        try {
          const dateObj = new Date(date_publication);
          if (!isNaN(dateObj.getTime())) {
            datePublicationEscaped = db.escape(dateObj.toISOString().slice(0, 19).replace('T', ' '));
          } else {
            datePublicationEscaped = db.escape(new Date().toISOString().slice(0, 19).replace('T', ' '));
          }
        } catch (e) {
          datePublicationEscaped = db.escape(new Date().toISOString().slice(0, 19).replace('T', ' '));
        }
      } else {
        datePublicationEscaped = db.escape(new Date().toISOString().slice(0, 19).replace('T', ' '));
      }
    }

    const inscriptionRequiseValue = inscription_requise ? 1 : 0;

    console.log('💾 Préparation de l\'insertion...');

    // Construction de la requête d'insertion sans paramètres préparés
    const insertQuery = `
      INSERT INTO actualites (
        titre, description, contenu, type, statut, image, auteur_id, 
        date_publication, tags, lieu, places_disponibles, inscription_requise
      ) VALUES (
        ${titreEscaped}, 
        ${descriptionEscaped}, 
        ${contenuEscaped}, 
        ${typeEscaped}, 
        ${statutEscaped}, 
        ${imageEscaped}, 
        ${auteurIdNum}, 
        ${datePublicationEscaped}, 
        ${tagsEscaped}, 
        ${lieuEscaped}, 
        ${placesValue}, 
        ${inscriptionRequiseValue}
      )
    `;

    console.log('💾 Requête d\'insertion:', insertQuery);

    // Insertion en base
    const [result] = await db.query(insertQuery);

    console.log('✅ Actualité insérée avec l\'ID:', result.insertId);

    // Récupérer l'actualité créée
    const selectQuery = `
      SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = ${result.insertId}
    `;

    const [newActualite] = await db.query(selectQuery);

    if (newActualite.length === 0) {
      return Response.json(
        { error: 'Actualité créée mais impossible de la récupérer' },
        { status: 500 }
      );
    }

    const actualiteCreee = {
      id: newActualite[0].id,
      titre: newActualite[0].titre,
      description: newActualite[0].description,
      contenu: newActualite[0].contenu,
      type: newActualite[0].type,
      statut: newActualite[0].statut,
      image: newActualite[0].image || '/images/actualites/default.jpg',
      date_creation: newActualite[0].date_creation,
      date_publication: newActualite[0].date_publication,
      date_modification: newActualite[0].date_modification,
      tags: newActualite[0].tags ? JSON.parse(newActualite[0].tags) : [],
      lieu: newActualite[0].lieu,
      places_disponibles: newActualite[0].places_disponibles,
      inscription_requise: Boolean(newActualite[0].inscription_requise),
      auteur: {
        id: newActualite[0].auteur_id,
        prenom: newActualite[0].auteur_prenom,
        nom: newActualite[0].auteur_nom,
        photo: newActualite[0].auteur_photo || '/images/default-avatar.jpg',
        bio: newActualite[0].auteur_bio || ''
      }
    };

    console.log('✅ Actualité créée avec succès:', actualiteCreee.id);

    return Response.json(
      {
        message: 'Actualité créée avec succès',
        actualite: actualiteCreee
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'actualité:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Gestion des erreurs spécifiques
    let errorMessage = 'Erreur serveur lors de la création de l\'actualité';
    let statusCode = 500;
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Table actualites non trouvée dans la base de données';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Erreur de structure de base de données';
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Référence auteur invalide';
      statusCode = 400;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Données trop longues pour un ou plusieurs champs';
      statusCode = 400;
    } else if (error.code === 'ER_WRONG_ARGUMENTS') {
      errorMessage = 'Arguments invalides pour la requête SQL';
      statusCode = 400;
    }
    
    return Response.json(
      { 
        error: errorMessage,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          code: error.code,
          sqlMessage: error.sqlMessage
        } : undefined
      },
      { status: statusCode }
    );
  }
}