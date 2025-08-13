import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ensemble pour l'inclusion<br />
              <span className="text-yellow-300">et la solidarité</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Maison d'Actions Solidaires accompagne les personnes en situation de handicap, 
              les personnes âgées et leurs aidants vers plus d'autonomie et de bien-être.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/nosactions" 
                className="bg-yellow-400 text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-yellow-300 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Découvrir nos actions
              </Link>
              <Link 
                href="/faireundon" 
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-200"
              >
                Faire un don
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Actions Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos 5 Pôles d'Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment nous agissons concrètement pour l'inclusion et l'autonomie
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Pôle Numérique",
                description: "Formation informatique et accompagnement numérique",
                icon: "💻",
                color: "bg-blue-100 text-blue-800"
              },
              {
                title: "Pôle Administratif", 
                description: "Aide aux démarches administratives",
                icon: "📋",
                color: "bg-red-100 text-red-800"
              },
              {
                title: "Pôle Soutien",
                description: "Écoute, orientation et accompagnement psychologique",
                icon: "🤝",
                color: "bg-cyan-100 text-cyan-800"
              },
              {
                title: "Pôle Bien-être",
                description: "Ateliers de relaxation et prévention burn-out",
                icon: "🌱",
                color: "bg-green-100 text-green-800"
              },
              {
                title: "Pôle Junior",
                description: "Accompagnement des enfants à besoins spécifiques",
                icon: "👶",
                color: "bg-orange-100 text-orange-800"
              }
            ].map((pole, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 border border-gray-100">
                <div className="text-4xl mb-4">{pole.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{pole.title}</h3>
                <p className="text-gray-600 mb-4">{pole.description}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${pole.color}`}>
                  En savoir plus
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Notre Impact
            </h2>
            <p className="text-xl text-gray-600">
              Des résultats concrets au service de l'inclusion
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "50+", label: "Personnes accompagnées", description: "chaque mois" },
              { number: "5", label: "Pôles d'action", description: "spécialisés" },
              { number: "75", label: "Appels d'écoute", description: "par mois en 2025" }
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white rounded-xl p-8 shadow-lg">
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-xl font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez notre mission
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Ensemble, nous pouvons faire la différence dans la vie de nombreuses personnes. 
            Découvrez comment vous pouvez contribuer à notre action solidaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/association" 
              className="bg-white text-green-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              En savoir plus sur nous
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-200"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}