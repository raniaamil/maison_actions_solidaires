import React, { useState, useEffect } from 'react';

const AdminActualitesFilters = ({ 
  articles = [], // Valeur par défaut
  onFilteredArticlesChange, 
  currentUser,
  loading = false // Valeur par défaut
}) => {
  const [filters, setFilters] = useState({
    category: 'toutes',
    status: 'tous',
    author: 'tous',
    dateRange: 'toutes'
  });

  const [filteredArticles, setFilteredArticles] = useState(articles);

  // Options de filtres
  const categories = [
    { value: 'toutes', label: 'Toutes les catégories' },
    { value: 'numérique', label: 'Numérique' },
    { value: 'administratif', label: 'Administratif' },
    { value: 'soutien', label: 'Soutien' },
    { value: 'bien-être', label: 'Bien-être' },
    { value: 'junior', label: 'Junior' },
    { value: 'événement', label: 'Événement' },
    { value: 'témoignage', label: 'Témoignage' }
  ];

  const statusOptions = [
    { value: 'tous', label: 'Tous les statuts' },
    { value: 'Publié', label: 'Publiés' },
    { value: 'Brouillon', label: 'Brouillons' }
  ];

  const authorOptions = [
    { value: 'tous', label: 'Tous les auteurs' },
    { value: 'moi', label: 'Mes articles' },
    { value: 'autres', label: 'Articles des autres' }
  ];

  const dateRanges = [
    { value: 'toutes', label: 'Toutes les dates' },
    { value: 'aujourd-hui', label: 'Aujourd\'hui' },
    { value: 'semaine', label: 'Cette semaine' },
    { value: 'mois', label: 'Ce mois' },
    { value: 'trimestre', label: 'Ce trimestre' },
    { value: 'annee', label: 'Cette année' }
  ];

  // Fonction de filtrage
  useEffect(() => {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      setFilteredArticles([]);
      if (onFilteredArticlesChange) {
        onFilteredArticlesChange([]);
      }
      return;
    }

    let filtered = [...articles];

    // Filtre par catégorie
    if (filters.category !== 'toutes') {
      filtered = filtered.filter(article => article.type === filters.category);
    }

    // Filtre par statut
    if (filters.status !== 'tous') {
      filtered = filtered.filter(article => 
        (article.statut || article.status) === filters.status
      );
    }

    // Filtre par auteur
    if (filters.author !== 'tous' && currentUser) {
      if (filters.author === 'moi') {
        filtered = filtered.filter(article => 
          (article.auteur?.id || article.auteur_id) === currentUser.id
        );
      } else if (filters.author === 'autres') {
        filtered = filtered.filter(article => 
          (article.auteur?.id || article.auteur_id) !== currentUser.id
        );
      }
    }

    // Filtre par date
    if (filters.dateRange !== 'toutes') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.date_creation || article.date);
        
        switch (filters.dateRange) {
          case 'aujourd-hui':
            const articleDay = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate());
            return articleDay.getTime() === today.getTime();
          case 'semaine':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return articleDate >= weekAgo;
          case 'mois':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            return articleDate >= monthAgo;
          case 'trimestre':
            const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            return articleDate >= quarterAgo;
          case 'annee':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            return articleDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredArticles(filtered);
    if (onFilteredArticlesChange) {
      onFilteredArticlesChange(filtered);
    }
  }, [articles, filters, currentUser, onFilteredArticlesChange]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'toutes',
      status: 'tous',
      author: 'tous',
      dateRange: 'toutes'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    !['toutes', 'tous'].includes(value)
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="flex flex-wrap gap-4">
            <div className="h-10 bg-gray-200 rounded w-48"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
            <div className="h-10 bg-gray-200 rounded w-44"></div>
            <div className="h-10 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Titre de la section */}
        <div className="flex items-center justify-between">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtre Catégorie */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Auteur */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Auteur
            </label>
            <select
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {authorOptions.map(author => (
                <option key={author.value} value={author.value}>
                  {author.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">{filteredArticles?.length || 0}</span>
            {' '}article{(filteredArticles?.length || 0) !== 1 ? 's' : ''} trouvé{(filteredArticles?.length || 0) !== 1 ? 's' : ''}
            {hasActiveFilters && (
              <span className="ml-2 text-gray-500">
                (sur {articles?.length || 0})
              </span>
            )}
          </div>

          {/* Indicateurs de filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.category !== 'toutes' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {categories.find(c => c.value === filters.category)?.label}
                </span>
              )}
              {filters.status !== 'tous' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {statusOptions.find(s => s.value === filters.status)?.label}
                </span>
              )}
              {filters.author !== 'tous' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {authorOptions.find(a => a.value === filters.author)?.label}
                </span>
              )}
              {filters.dateRange !== 'toutes' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {dateRanges.find(d => d.value === filters.dateRange)?.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActualitesFilters;