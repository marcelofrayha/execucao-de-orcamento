import React from 'react';
import { FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';

interface SecondaryCTAProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export default function SecondaryCTA({ title, description, buttonText, buttonLink }: SecondaryCTAProps) {
  return (
    <section className="text-center py-8">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center text-center">
        {/* Ícone */}
        <FaCalendarAlt className="w-16 h-16 text-primary mb-6" />

        {/* Título */}
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {title}
        </h2>

        {/* Descrição */}
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {description}
        </p>

        {/* Botão */}
        <a
          href={buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-primary dark:bg-secondary text-white rounded-lg shadow hover:bg-primary-dark dark: hover:bg-secondary-dark transition-colors transform hover:scale-105"
        >
          {buttonText}
        </a>
      </div>
    </section>
  );
} 