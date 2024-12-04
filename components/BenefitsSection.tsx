import React from 'react';
import { FaCheckCircle, FaShieldAlt, FaChartLine, FaHandsHelping } from 'react-icons/fa';

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: <FaCheckCircle className="w-12 h-12 text-primary" />,
    title: "Fácil de Usar",
    description: "Interface intuitiva que permite gerenciar e analisar o orçamento municipal com facilidade e eficiência.",
  },
  {
    icon: <FaShieldAlt className="w-12 h-12 text-primary" />,
    title: "Transparência",
    description: "Garantia de total transparência nas receitas e despesas municipais, promovendo a confiança da comunidade.",
  },
  {
    icon: <FaChartLine className="w-12 h-12 text-primary" />,
    title: "Análises Avançadas",
    description: "Ferramentas poderosas para criar relatórios personalizados e gráficos interativos para uma visão completa.",
  },
  {
    icon: <FaHandsHelping className="w-12 h-12 text-primary" />,
    title: "Suporte Dedicado",
    description: "Equipe de suporte pronta para ajudar a qualquer momento, garantindo o melhor uso de nossa plataforma.",
  },
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="text-center py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Por que Escolher a KOI?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Descubra os benefícios que tornam nossa plataforma a escolha certa para a gestão financeira municipal.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0">
                {benefit.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">{benefit.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 