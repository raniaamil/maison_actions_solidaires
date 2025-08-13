import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Section Hero */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Maison d'Actions</span>
                    <span className="block text-green-600">Solidaires</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Ensemble pour l'inclusion et la solidarité. Nous accompagnons les personnes en situation de handicap, 
                    les personnes âgées et leurs aidants vers plus d'autonomie et de bien-être.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        href="/nosactions"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                      >
                        Découvrir nos actions
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        href="/contact"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                      >
                        Nous contacter
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                  <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                    <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                      <Image
                        src="/images/association/mas.png"
                        alt="Maison d'Actions Solidaires"
                        width={500}
                        height={300}
                        className="w-full h-64 object-cover"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Section Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Nos Pôles d'Action
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Cinq domaines d'expertise pour un accompagnement complet et personnalisé
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Pôle Numérique",
                description: "Initiation informatique et démarches administratives en ligne",
                icon: "💻",
                color: "bg-blue-100 text-blue-600"
              },
              {
                title: "Pôle Administratif",
                description: "Accompagnement MDPH et formalités administratives",
                icon: "📋",
                color: "bg-red-100 text-red-600"
              },
              {
                title: "Pôle Soutien",
                description: "Écoute téléphonique et groupes de parole",
                icon: "🤝",
                color: "bg-yellow-100 text-yellow-600"
              },
              {
                title: "Pôle Bien-être",
                description: "Relaxation, musicothérapie et gestion du stress",
                icon: "🌱",
                color: "bg-green-100 text-green-600"
              },
              {
                title: "Pôle Junior",
                description: "Accompagnement des enfants à besoins spécifiques",
                icon: "👶",
                color: "bg-purple-100 text-purple-600"
              }
            ].map((service, index) => (
              <div key={index} className="relative group">
                <div className="relative p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className={`inline-flex p-3 rounded-lg ${service.color}`}>
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-gray-500">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/nosactions"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors duration-200"
            >
              Voir tous nos services
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Notre Impact en Chiffres
            </h2>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { number: "200+", label: "Personnes accompagnées" },
              { number: "50+", label: "Ateliers organisés" },
              { number: "5", label: "Pôles d'expertise" },
              { number: "3", label: "Années d'expérience" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-extrabold text-green-600">
                  {stat.number}
                </div>
                <div className="mt-2 text-lg font-medium text-gray-900">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Ils nous font confiance
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">M</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Marie D.</h4>
                  <p className="text-gray-500">Bénéficiaire</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Grâce à l'accompagnement de MAACSO, j'ai retrouvé confiance en moi et je suis maintenant autonome 
                dans mes démarches administratives en ligne."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">P</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Pierre L.</h4>
                  <p className="text-gray-500">Aidant familial</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Les groupes de parole m'ont permis de ne plus me sentir seul face aux difficultés. 
                L'équipe est vraiment à l'écoute."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Rejoignez notre communauté solidaire
          </h2>
          <p className="mt-4 text-xl text-green-100">
            Ensemble, construisons un monde plus inclusif et bienveillant
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/faireundon"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Faire un don
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-green-700 transition-colors duration-200"
            >
              Devenir bénévole
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}