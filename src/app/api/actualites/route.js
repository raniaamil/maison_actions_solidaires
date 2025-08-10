// src/app/api/actualites/route.js
export const runtime = 'nodejs';
import db from '../../../lib/db';

// GET - Récupérer toutes les actualités
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const auteur_id = searchParams.get('auteur_id');
    const limit = searchParams.get('limit') || 50;
    const offset = searchParams.get('offset') || 0;

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
      query += ' AND a.auteur_id = ?';
      params.push(parseInt(auteur_id));
    }

    query += ' ORDER BY a.date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.execute(query, params);

    // Transformer les données pour correspondre au format attendu par le frontend
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
      date: new Date(row.date_creation).toLocaleDateString('fr-FR'), // Format pour l'affichage
      date_publication: row.date_publication,
      date_modification: row.date_modification,
      updatedDate: row.date_modification ? new Date(row.date_modification).toLocaleDateString('fr-FR') : null,
      tags: row.tags ? JSON.parse(row.tags) : [],
      lieu: row.lieu,
      location: row.lieu, // Alias pour compatibilité
      places_disponibles: row.places_disponibles,
      places: row.places_disponibles, // Alias pour compatibilité
      inscription_requise: row.inscription_requise,
      hasRegistration: row.inscription_requise, // Alias pour compatibilité
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
    console.error('Erreur lors de la récupération des actualités:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la récupération des actualités' },
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

    // Validation
    if (!titre || !description || !contenu || !type || !auteur_id) {
      return Response.json(
        { error: 'Les champs titre, description, contenu, type et auteur_id sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'auteur existe
    const [auteurCheck] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [auteur_id]
    );

    if (auteurCheck.length === 0) {
      return Response.json(
        { error: 'Auteur non trouvé' },
        { status: 404 }
      );
    }

    const [result] = await db.execute(
      `INSERT INTO actualites (
        titre, description, contenu, type, statut, image, auteur_id, 
        date_publication, tags, lieu, places_disponibles, inscription_requise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titre,
        description,
        contenu,
        type,
        statut,
        image || null,
        auteur_id,
        statut === 'Publié' ? (date_publication || new Date()) : null,
        tags ? JSON.stringify(tags) : null,
        lieu || null,
        places_disponibles || null,
        inscription_requise
      ]
    );

    // Récupérer l'actualité créée avec les infos de l'auteur
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

    return Response.json(
      {
        message: 'Actualité créée avec succès',
        actualite: {
          id: newActualite[0].id,
          titre: newActualite[0].titre,
          description: newActualite[0].description,
          contenu: newActualite[0].contenu,
          type: newActualite[0].type,
          statut: newActualite[0].statut,
          image: newActualite[0].image,
          date_creation: newActualite[0].date_creation,
          date_publication: newActualite[0].date_publication,
          auteur: {
            id: newActualite[0].auteur_id,
            prenom: newActualite[0].auteur_prenom,
            nom: newActualite[0].auteur_nom,
            photo: newActualite[0].auteur_photo,
            bio: newActualite[0].auteur_bio
          }
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l\'actualité:', error);
    return Response.json(
      { error: 'Erreur serveur lors de la création de l\'actualité' },
      { status: 500 }
    );
  }
}