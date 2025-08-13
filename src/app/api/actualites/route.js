export const runtime = 'nodejs';
import db from '../../../lib/db';

// GET - Récupérer toutes les actualités
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const auteur_id = searchParams.get('auteur_id');
    
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const limit = limitParam ? Math.max(1, Math.min(1000, parseInt(limitParam, 10))) : 50;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    let query = `
      SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (statut) {
      query += ' AND a.statut = ?';
      params.push(statut);
    }

    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    if (auteur_id) {
      const auteurIdNum = parseInt(auteur_id, 10);
      if (!isNaN(auteurIdNum)) {
        query += ' AND a.auteur_id = ?';
        params.push(auteurIdNum);
      }
    }

    query += ' ORDER BY a.date_creation DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(query, params);

    // Transformer les données pour correspondre au format attendu
    const actualites = rows.map(row => ({
      id: row.id,
      titre: row.titre,
      title: row.titre, // Alias pour compatibilité
      description: row.description,
      contenu: row.contenu,
      content: row.contenu, // Alias pour compatibilité
      type: row.type,
      statut: row.statut,
      status: row.statut, // Alias pour compatibilité
      image: row.image,
      date_creation: row.date_creation,
      date: row.date_creation ? new Date(row.date_creation).toLocaleDateString('fr-FR') : '',
      date_publication: row.date_publication,
      date_modification: row.date_modification,
      updatedDate: row.date_modification ? new Date(row.date_modification).toLocaleDateString('fr-FR') : null,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
      lieu: row.lieu,
      location: row.lieu, // Alias pour compatibilité
      places_disponibles: row.places_disponibles,
      places: row.places_disponibles, // Alias pour compatibilité
      inscription_requise: Boolean(row.inscription_requise),
      hasRegistration: Boolean(row.inscription_requise), // Alias pour compatibilité
      auteur: {
        id: row.auteur_id,
        prenom: row.auteur_prenom,
        firstName: row.auteur_prenom, // Alias pour compatibilité
        nom: row.auteur_nom,
        lastName: row.auteur_nom, // Alias pour compatibilité
        photo: row.auteur_photo,
        bio: row.auteur_bio
      },
      author: { // Alias pour compatibilité
        firstName: row.auteur_prenom,
        lastName: row.auteur_nom
      }
    }));

    return Response.json(actualites);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actualités:', error);
    
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des actualités',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
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

    // Conversion et validation de l'ID auteur
    const auteurIdNum = parseInt(auteur_id, 10);
    if (isNaN(auteurIdNum)) {
      return Response.json(
        { error: 'ID auteur invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'auteur existe
    const [auteurCheck] = await db.execute(
      'SELECT id, prenom, nom FROM users WHERE id = ?',
      [auteurIdNum]
    );

    if (auteurCheck.length === 0) {
      return Response.json(
        { error: 'Auteur non trouvé' },
        { status: 404 }
      );
    }

    // Préparation des données
    const tagsJson = tags && Array.isArray(tags) && tags.length > 0 ? JSON.stringify(tags) : null;
    const imageValue = image && typeof image === 'string' && image.trim() !== '' ? image.trim() : null;
    const lieuValue = lieu && typeof lieu === 'string' && lieu.trim() !== '' ? lieu.trim() : null;
    
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
          datePublicationValue = new Date(date_publication).toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
          datePublicationValue = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
      } else {
        datePublicationValue = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    // Insertion en base
    const [result] = await db.execute(
      `INSERT INTO actualites (
        titre, description, contenu, type, statut, image, auteur_id, 
        date_publication, tags, lieu, places_disponibles, inscription_requise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titre.trim(),
        description.trim(),
        contenu.trim(),
        type,
        statut,
        imageValue,
        auteurIdNum,
        datePublicationValue,
        tagsJson,
        lieuValue,
        placesValue,
        Boolean(inscription_requise)
      ]
    );

    // Récupérer l'actualité créée
    const [newActualite] = await db.execute(
      `SELECT 
        a.*,
        u.prenom as auteur_prenom,
        u.nom as auteur_nom,
        u.photo as auteur_photo,
        u.bio as auteur_bio
      FROM actualites a
      JOIN users u ON a.auteur_id = u.id
      WHERE a.id = ?`,
      [result.insertId]
    );

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
      image: newActualite[0].image,
      date_creation: newActualite[0].date_creation,
      date_publication: newActualite[0].date_publication,
      tags: newActualite[0].tags ? JSON.parse(newActualite[0].tags) : [],
      lieu: newActualite[0].lieu,
      places_disponibles: newActualite[0].places_disponibles,
      inscription_requise: Boolean(newActualite[0].inscription_requise),
      auteur: {
        id: newActualite[0].auteur_id,
        prenom: newActualite[0].auteur_prenom,
        nom: newActualite[0].auteur_nom,
        photo: newActualite[0].auteur_photo,
        bio: newActualite[0].auteur_bio
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
    }
    
    return Response.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          sqlMessage: error.sqlMessage
        } : undefined
      },
      { status: statusCode }
    );
  }
}