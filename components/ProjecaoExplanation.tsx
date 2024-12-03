interface ProjecaoExplanationProps {
  selectedYear: number;
}

export function ProjecaoExplanation({ selectedYear }: ProjecaoExplanationProps) {
  const weights = [
    { year: selectedYear - 1, weight: 30 },
    { year: selectedYear - 2, weight: 25 },
    { year: selectedYear - 3, weight: 20 },
    { year: selectedYear - 4, weight: 15 },
    { year: selectedYear - 5, weight: 10 },
  ];

  return (
    <div className="bg-card rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Metodologia da Projeção</h3>
      
      <p className="text-muted-foreground">
        As projeções são calculadas utilizando um modelo de média ponderada histórica, 
        onde anos mais recentes têm maior influência no resultado final. O cálculo 
        considera a proporção entre o valor executado até o mês de referência e o valor total 
        executado em dezembro de cada ano anterior, aplicando os seguintes pesos:
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        {weights.map(({ year, weight }) => (
          <div key={year} className="bg-muted/50 p-4 rounded-lg text-center">
            <div className="font-medium">{year}</div>
            <div className="text-sm text-muted-foreground">{weight}%</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        Caso não haja dados para algum ano seu peso é distribuído proporcionalmente entre os anos disponíveis. 
        {/* O sistema também aplica técnicas estatísticas para identificar e ajustar valores 
        atípicos (outliers), utilizando o desvio padrão como referência, garantindo 
        assim projeções mais consistentes. */}
      </p>
    </div>
  );
} 