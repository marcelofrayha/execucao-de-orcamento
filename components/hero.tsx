import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-gray-800 to-gray-300 text-white py-20 w-full h-[80vh]">
      {/* Background Image */}
      <Image
        src="/images/koi-hero-image.jpg"
        alt="Gestão Financeira Municipal"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 z-0"
      />

      {/* Overlay to Improve Text Legibility */}
      <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 h-full justify-center">
        {/* Título */}
        <h1 className="text-5xl font-bold mb-4">
          Transforme a Gestão Financeira do Seu Município
        </h1>
        
        {/* Subtítulo */}
        <p className="text-xl mb-8 max-w-2xl">
          Ferramentas intuitivas para análise detalhada de receitas e despesas municipais, garantindo transparência, eficiência e previsibilidade.
        </p>
        
        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/sign-up"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
          >
            Comece Agora
          </a>
          <a
            href="/#funcionalidades-principais"
            className="px-6 py-3 bg-transparent border border-white text-white font-semibold rounded-lg shadow hover:bg-white hover:text-blue-600 transition"
          >
            Saiba Mais
          </a>
        </div>
      </div>
    </section>
  );
}
