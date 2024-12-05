Análise de Orçamento Municipal da KOI
Análise de Orçamento Municipal da KOI é uma aplicação web projetada para auxiliar governos municipais na gestão e análise eficiente de seus orçamentos. A plataforma oferece análises financeiras avançadas, projeções orçamentárias e relatórios personalizáveis para apoiar a tomada de decisões estratégicas. Construída com tecnologias modernas, o sistema garante escalabilidade, segurança e uma experiência de usuário fluida.
📋 Índice
- [Características](#🌟-características)
- [Arquitetura](#🏗️-arquitetura)
- [Tecnologias Utilizadas](#🛠️-tecnologias-utilizadas)
- [Instalação](#🔧-instalação)
- [Uso](#🚀-uso)
- [Estrutura do Projeto](#📂-estrutura-do-projeto)
- [Endpoints da API](#📚-endpoints-da-api)
- [Considerações de Segurança](#🔒-considerações-de-segurança)
- [Escalabilidade e Desempenho](#📈-escalabilidade-e-desempenho)
- [Contribuição](#🤝-contribuição)
- [Licença](#📄-licença)
- [Contato](#📞-contato)
🌟 Características
- [Autenticação Segura](#autenticação-segura)
- [Dashboard Interativo](#dashboard-interativo)
- [Projeções Orçamentárias](#projeções-orçamentárias)
- [Upload de Dados](#upload-de-dados)
- [Relatórios Personalizados](#relatórios-personalizados)
- [Interface Responsiva](#interface-responsiva)
- [Estilo Moderno](#estilo-moderno)
🏗️ Arquitetura
A aplicação segue uma [Arquitetura Serverless](#arquitetura-serverless) utilizando Next.js para o frontend e Supabase para os serviços de backend. O hospedagem é gerenciado via Vercel, garantindo desempenho e escalabilidade ótimos.
🛠️ Tecnologias Utilizadas
- **Frontend**
  - [Next.js](https://nextjs.org/): Framework para aplicações React com renderização no servidor.
  - [React](https://reactjs.org/): Biblioteca JavaScript para construir interfaces de usuário.
  - [Tailwind CSS](https://tailwindcss.com/): Framework CSS utilitário para estilização rápida.
  - [shadcn/ui](https://shadcn.com/): Componentes UI acessíveis e personalizáveis.
  - [React Icons](https://react-icons.github.io/react-icons/): Biblioteca de ícones populares.
  - [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2): Bibliotecas para visualização de dados em gráficos.
- **Backend**
  - [Supabase](https://supabase.com/): Backend como serviço fornecendo autenticação, banco de dados e armazenamento.
  - [PostgreSQL](https://www.postgresql.org/): Banco de dados relacional para armazenamento de dados estruturados.
  - Next.js API Routes: Funções serverless para lógica de backend.
🔧 Instalação
1. Clonar o Repositório
koi
2. Instalar as Dependências
Certifique-se de ter o Node.js instalado.
install
3. Configurar Variáveis de Ambiente
Renomeie o arquivo .env.example para .env.local e preencha os valores necessários:
Você pode encontrar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas configurações de API do seu projeto Supabase.
4. Executar o Servidor de Desenvolvimento
dev
A aplicação estará disponível em http://localhost:3000.
🚀 Uso
Registro e Autenticação
Acesse a página de cadastro (/sign-up) para criar uma nova conta.
Após o registro, verifique seu email para confirmar a conta.
Faça login na página de entrada (/sign-in).
Inicialização do Perfil
Após autenticação, você será redirecionado para inicializar seu perfil, fornecendo informações adicionais sobre o município.
Upload de Dados Financeiros
Navegue até o dashboard protegido para fazer upload de arquivos XLSX contendo dados de despesas e receitas.
Análise e Visualização
Utilize as ferramentas de visualização para analisar os dados financeiros e gerar projeções orçamentárias.
📂 Estrutura do Projeto
A seguir, uma visão geral dos principais diretórios e arquivos do projeto:
app/page.tsx
Página principal da aplicação, que inclui seções como Hero, Funcionalidades e Benefícios.
.
components/hero.tsx
Componente Hero que exibe o banner principal com imagem de fundo e chamadas para ação.
}
components/FeatureCard.tsx
Componente de cartão para destacar funcionalidades principais.
;
app/api/initialize-profile/route.ts
Rota API para inicializar o perfil do usuário após o cadastro.
}
app/layout.tsx
Layout raiz da aplicação, incluindo navegação e rodapé.
}
app/actions.ts
Ações do servidor para gerenciar autenticação de usuários.
;
📚 Endpoints da API
Autenticação
Registrar Usuário
Endpoint: /sign-up
Método: POST
Descrição: Registra um novo usuário e envia um email de verificação.
Fazer Login
Endpoint: /sign-in
Método: POST
Descrição: Autentica um usuário existente.
Inicialização do Perfil
Inicializar Perfil
Endpoint: /api/initialize-profile
Método: POST
Descrição: Armazena informações adicionais do perfil do usuário na tabela municipios.
Gestão de Dados
Upload de Despesas e Receitas
Endpoint: /api/upload-data
Método: POST
Descrição: Trata a ingestão de dados financeiros a partir de arquivos XLSX para o banco de dados.
Rotas Protegidas
Dashboard
Endpoint: /protected/dashboard
Método: GET
Descrição: Recupera e exibe dados financeiros agregados para análise.
🔒 Considerações de Segurança
Autenticação e Autorização
Utiliza Supabase Auth para garantir acesso seguro aos recursos protegidos.
Rotas protegidas são guardadas para evitar acesso não autorizado.
Validação e Sanitização de Dados
Entradas dos usuários e arquivos importados são validados tanto no cliente quanto no servidor para prevenir injeção de dados maliciosos.
Variáveis de Ambiente
Informações sensíveis, como chaves do Supabase e URLs de APIs, são armazenadas de forma segura como variáveis de ambiente no Vercel.
Encriptação HTTPS
Todas as comunicações são protegidas via HTTPS para garantir a segurança dos dados em trânsito.
📈 Escalabilidade e Desempenho
Arquitetura Serverless
Aproveita as funções serverless do Vercel para garantir que a aplicação escale automaticamente conforme o tráfego.
Consultas Otimizadas
Modelagem eficiente do banco de dados e indexação para lidar com grandes volumes de dados de forma eficaz.
Caching
Implementa estratégias de caching no lado do cliente para reduzir chamadas redundantes e melhorar os tempos de carregamento.
🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou submeter pull requests para melhorar este projeto.
Fork este repositório
Crie uma branch para sua feature (git checkout -b feature/nova-feature)
Commit suas alterações (git commit -m 'Adiciona nova feature')
Faça o push para a branch (git push origin feature/nova-feature)
Abra um Pull Request
📄 Licença
Este projeto está licenciado sob a Licença MIT.
📞 Contato
Para quaisquer dúvidas ou sugestões, entre em contato:
Email: contato@institutokoi.org
Facebook: Instituto KOI