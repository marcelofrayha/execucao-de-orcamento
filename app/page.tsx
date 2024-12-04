import Hero from "@/components/hero";
import FeatureCard from "@/components/FeatureCard";
import BenefitsSection from "@/components/BenefitsSection";
import SecondaryCTA from "@/components/SecondaryCTA";
import { FaChartBar, FaChartLine, FaRegFileAlt } from "react-icons/fa";

export default function Index() {
  const features = [
    {
      title: "Análise Financeira Avançada",
      description: "Obtenha uma visão detalhada das receitas e despesas municipais com gráficos interativos e relatórios abrangentes.",
      Icon: FaChartBar,
    },
    {
      title: "Projeção de Orçamento do Município",
      description: "Projete o orçamento para o final do ano com base em dados históricos, estatísticas e análises de tendências.",
      Icon: FaChartLine,
    },
    {
      title: "Relatórios Personalizados para Gestão",
      description: "Elabore relatórios customizados que auxiliam na tomada de decisões estratégicas e no monitoramento do desempenho financeiro ao longo do tempo.",
      Icon: FaRegFileAlt,
    },
  ];

  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-12 px-4 py-8 max-w-5xl mx-auto">
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Bem-vindo à Análise de Orçamento Municipal da KOI</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Nosso aplicativo oferece uma ferramenta poderosa para gerenciar e analisar o orçamento do seu município de forma eficiente e segura.
          </p>
        </section>

        <section id="funcionalidades-principais" className="text-center py-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Funcionalidades Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                Icon={feature.Icon}
              />
            ))}
          </div>
        </section>

        <BenefitsSection />

        <section className="text-center py-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Como Começar</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Cadastre-se ou faça o login para acessar todas as funcionalidades e começar a gerenciar seu orçamento municipal de forma mais eficaz.
          </p>
          <div className="flex justify-center gap-4">
            <a href="/sign-up" className="px-6 py-3 bg-primary dark:bg-secondary text-white rounded-lg shadow hover:bg-primary-dark dark:hover:bg-secondary-dark transition-colors transform hover:scale-105">
              Cadastrar
            </a>
            <a href="/sign-in" className="px-6 py-3 bg-primary dark:bg-secondary text-white rounded-lg shadow hover:bg-primary-dark dark: hover:bg-secondary-dark transition-colors transform hover:scale-105">
              Entrar
            </a>
          </div>
        </section>

        <SecondaryCTA
          title="Quer Saber Mais?"
          description="Agende uma reunião conosco para descobrir como podemos ajudar a otimizar a gestão financeira do seu município."
          buttonText="Saiba Mais"
          buttonLink="/#funcionalidades-principais"
        />
      </main>
    </>
  );
}
