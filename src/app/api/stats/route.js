// src/app/api/stats/route.js
export const runtime = 'nodejs';
import db from '../../../lib/db';

// GET - Récupérer les statistiques générales du site
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    // Statistiques de base
    const [userStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'Administrateur' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'Rédacteur' THEN 1 END) as redacteurs,
        COUNT(CASE WHEN actif = TRUE THEN 1 END) as users_actifs
      FROM users
    `);

    const [articleStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_articles,
        COUNT(CASE WHEN statut = 'Publié' THEN 1 END) as articles_publies,
        COUNT(CASE WHEN statut = 'Brouillon' THEN 1 END) as articles_brouillon,
        COUNT(CASE WHEN type = 'événement' THEN 1 END) as evenements,
        COUNT(CASE WHEN type = 'témoignage' THEN 1 END) as temoignages,
        COUNT(CASE WHEN type = 'numérique' THEN 1 END) as numerique,
        COUNT(CASE WHEN type = 'administratif' THEN 1 END) as administratif,
        COUNT(CASE WHEN type = 'soutien' THEN 1 END) as soutien,
        COUNT(CASE WHEN type = 'bien-être' THEN 1 END) as bien_etre,
        COUNT(CASE WHEN type = 'junior' THEN 1 END) as junior
      FROM actualites
    `);

    // Articles récents
    const [recentArticles] = await db.execute(`
      SELECT 
        COUNT(*) as articles_ce_mois
      FROM actualites 
      WHERE DATE(date_creation) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND statut = 'Publié'
    `);

    const stats = {
      users: {
        total: userStats[0].total_users,
        admins: userStats[0].admins,
        redacteurs: userStats[0].redacteurs,
        actifs: userStats[0].users_actifs
      },
      articles: {
        total: articleStats[0].total_articles,
        publies: articleStats[0].articles_publies,
        brouillons: articleStats[0].articles_brouillon,
        ce_mois: recentArticles[0].articles_ce_mois
      },
      types: {
        evenements: articleStats[0].evenements,
        temoignages: articleStats[0].temoignages,
        numerique: articleStats[0].numerique,
        administratif: articleStats[0].administratif,
        soutien: articleStats[0].soutien,
        bien_etre: articleStats[0].bien_etre,
        junior: articleStats[0].junior
      }
    };

    // Détails supplémentaires si demandés
    if (includeDetails) {
      // Auteurs les plus actifs
      const [topAuthors] = await db.execute(`
        SELECT 
          u.prenom, 
          u.nom, 
          COUNT(a.id) as nb_articles
        FROM users u
        LEFT JOIN actualites a ON u.id = a.auteur_id
        WHERE u.actif = TRUE
        GROUP BY u.id, u.prenom, u.nom
        ORDER BY nb_articles DESC
        LIMIT 5
      `);

      // Articles récents
      const [latestArticles] = await db.execute(`
        SELECT 
          a.id,
          a.titre,
          a.type,
          a.statut,
          a.date_creation,
          CONCAT(u.prenom, ' ', u.nom) as auteur
        FROM actualites a
        JOIN users u ON a.auteur_id = u.id
        ORDER BY a.date_creation DESC
        LIMIT 5
      `);

      stats.details = {
        auteurs_actifs: topAuthors,
        articles_recents: latestArticles.map(article => ({
          ...article,
          date_creation: article.date_creation ? new Date(article.date_creation).toLocaleDateString('fr-FR') : ''
        }))
      };
    }

    stats.generated_at = new Date().toISOString();

    return Response.json(stats);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    return Response.json(
      { 
        error: 'Erreur serveur lors de la récupération des statistiques',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}