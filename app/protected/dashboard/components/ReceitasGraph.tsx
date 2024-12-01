import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { DadoHistoricoReceitaAgregado } from '@/utils/projecao';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ReceitasGraphProps {
  dadosHistoricosReceitas: DadoHistoricoReceitaAgregado[];
}

const ReceitasGraph: React.FC<ReceitasGraphProps> = ({ dadosHistoricosReceitas }) => {
  // Aggregate data
  const dataMap: { [key: string]: { [key: string]: number } } = {};

  // Debug log
  console.log('Raw data:', dadosHistoricosReceitas);

  dadosHistoricosReceitas.forEach((dado) => {
    const { ano, mes, fonte_recurso, receita_mes } = dado;
    const anoMes = `${ano}-${mes.toString().padStart(2, '0')}`;
    
    // Initialize if needed
    if (!dataMap[fonte_recurso]) {
      dataMap[fonte_recurso] = {};
    }
    
    // Ensure we're not adding to an existing value
    dataMap[fonte_recurso][anoMes] = receita_mes;
  });

  // Debug log
  console.log('Processed data:', dataMap);

  const fontes = Object.keys(dataMap);
  const meses = Array.from(
    new Set(dadosHistoricosReceitas.map((d) => `${d.ano}-${d.mes.toString().padStart(2, '0')}`))
  ).sort();

  const datasets = fontes.map((fonte, index) => ({
    label: fonte,
    data: meses.map((mes) => dataMap[fonte][mes] || 0),
    backgroundColor: `rgba(${(index * 50) % 255}, ${(index * 80) % 255}, ${(index * 110) % 255}, 0.5)`,
  }));

  // Debug log
  console.log('Final datasets:', datasets);

  const data = {
    labels: meses,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Receitas por Fonte de Recurso',
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-6">
      <Bar options={options} data={data} />
    </div>
  );
};

export default ReceitasGraph; 