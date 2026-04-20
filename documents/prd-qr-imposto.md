# PRD — App open-source de conscientização tributária

## Visão do produto

**Frase central:** Veja quanto imposto existe em cada compra do seu dia a dia.

**Frase emocional:** O preço você já sente. O app mostra quanto dele é imposto.

Este produto é um aplicativo mobile open-source com foco em conscientização popular sobre o peso dos tributos no consumo diário no Brasil.[cite:31][cite:34] O objetivo principal não é ser um app contábil ou uma planilha financeira, mas sim uma ferramenta cívica, simples e compartilhável, que transforma um dado normalmente invisível em percepção concreta para o cidadão.[cite:25][cite:34]

O app deve permitir que qualquer pessoa escaneie o QR Code de uma NFC-e, visualize rapidamente o valor da compra, o valor aproximado dos tributos e o peso relativo desse montante na própria compra e no acumulado do período.[cite:27][cite:31][cite:38] A proposta precisa ser simples o suficiente para uso em massa e forte o suficiente para gerar conversa pública e compartilhamento orgânico.[cite:25]

## Objetivo principal

Criar um aplicativo open-source, mobile-first, com experiência extremamente simples, capaz de mostrar ao usuário quanto imposto aproximado está embutido em cada compra do dia a dia, usando leitura de QR Code de NFC-e e uma apresentação visual clara, emocional e compartilhável.[cite:25][cite:27][cite:31]

## Problema

No consumo cotidiano, a maior parte das pessoas enxerga apenas o preço final e não percebe claramente quanto do valor pago corresponde a tributos embutidos.[cite:31][cite:34] Embora a legislação brasileira tenha estabelecido a obrigação de informar o valor aproximado dos tributos ao consumidor, essa informação ainda costuma aparecer de forma pouco visível, pouco explicada ou pouco memorável na prática.[cite:31][cite:34][cite:37]

Como consequência, o consumidor sente que "tudo está caro", mas raramente consegue relacionar esse custo à carga tributária de forma simples, acumulada e comparável.[cite:34] Falta uma ferramenta acessível que transforme esse dado fiscal em percepção pública de fácil entendimento.[cite:25][cite:34]

## Tese do produto

O brasileiro já sente o preço, mas não vê com clareza o peso tributário embutido em cada compra.[cite:31][cite:34] Se o valor aproximado dos tributos for apresentado de maneira simples, contextual e emocional, a percepção sobre consumo e carga tributária muda de forma imediata.[cite:31][cite:34]

## Público-alvo

### Primário

- Consumidor comum brasileiro, com pouco ou nenhum conhecimento técnico sobre sistema tributário.[cite:25]
- Pessoa que faz compras frequentes no varejo, supermercado, farmácia, posto, delivery e comércio geral.[cite:25]
- Usuário mobile que valoriza rapidez e entendimento instantâneo.[cite:25]

### Secundário

- Criadores de conteúdo e perfis cívicos/políticos/econômicos que desejam compartilhar exemplos reais.[cite:25]
- Jornalistas, educadores, influenciadores e movimentos de educação financeira/cidadania.[cite:25]
- Usuários mais engajados com controle de gastos que desejam ver o acumulado tributário ao longo do mês.[cite:25]

## Proposta de valor

O app transforma uma nota fiscal comum em uma leitura simples e impactante sobre tributos no consumo diário.[cite:27][cite:31] Em segundos, o usuário escaneia uma compra e entende três camadas de informação: fato, contexto e impacto.[cite:25]

### Camadas de comunicação

| Camada | Função | Exemplo |
|---|---|---|
| Fato | Mostrar o valor tributário da compra [cite:31][cite:34] | “Tributos aproximados: R$ 18,40” [cite:36] |
| Contexto | Explicar o peso relativo na compra [cite:31] | “Isso representa 21% desta compra” [cite:31] |
| Impacto | Transformar em percepção humana [cite:25] | “No mês, isso já virou X% do salário mínimo” [cite:25] |

Essa estrutura deve orientar toda a UX, a cópia e os cards de compartilhamento.[cite:25]

## Princípios do produto

- Radicalmente simples: abrir, escanear, entender.[cite:25]
- Fato antes de opinião: primeiro mostrar o dado, depois o peso dele.[cite:31][cite:34]
- Compartilhável por padrão: toda leitura importante deve poder virar card ou imagem.[cite:25]
- Transparente na metodologia: sempre indicar quando o valor é aproximado.[cite:30][cite:31]
- Open-source de verdade: cálculo, parsing e lógica auditáveis pela comunidade.[cite:25]
- Sem aparência de sistema fiscal complexo: experiência de utilidade pública, não de software técnico.[cite:25]

## Posicionamento

### Posicionamento curto

Um app open-source que lê sua nota fiscal e mostra quanto do seu dinheiro foi para tributos.

### Posicionamento emocional

O preço você já sente. O app mostra quanto dele é imposto.

### Posicionamento expandido

Uma ferramenta cívica e compartilhável para revelar, de forma simples, quanto imposto existe em cada compra do dia a dia.[cite:25][cite:31][cite:34]

## Naming direction

A linha de naming deve comunicar a ideia de “quanto vai para o governo” sem ficar longa, panfletária demais ou pouco memorável.[cite:25] O nome ideal precisa ser curto, forte, popular e imediatamente compreensível.

### Critérios para o nome

- Passar a ideia de destino do dinheiro pago.
- Ser curto o suficiente para app, domínio, @ e branding social.
- Soar forte, mas ainda utilizável por público amplo.
- Funcionar tanto em contexto neutro quanto em contextos virais.

### Direções sugeridas

- Vai Pro Governo
- Quanto Vai
- Vai Quanto
- Quanto Foi
- Quanto Levam
- Quanto Some
- Preço Real
- Quanto Vai Embora

### Recomendação inicial

**Quanto Vai** é a melhor direção preliminar porque é curta, memorável, emocional e deixa implícita a pergunta “quanto da minha compra vai para o governo?”.[cite:25]

## Objetivos de negócio e impacto

### Objetivos de produto

- Tornar visível o valor aproximado dos tributos embutidos nas compras cotidianas.[cite:31][cite:34]
- Criar experiência com atrito mínimo para uso recorrente.[cite:25]
- Estimular compartilhamento orgânico por meio de cards simples e fortes.[cite:25]
- Construir um projeto open-source com legitimidade pública e potencial de colaboração técnica.[cite:25]

### Objetivos de impacto

- Aumentar a consciência pública sobre carga tributária no consumo.[cite:34]
- Gerar conversas nas redes sociais a partir de dados pessoais reais de compra.[cite:25]
- Permitir que usuários percebam o peso acumulado do imposto ao longo do tempo.[cite:25]

## Métricas de sucesso

### Ativação

- Tempo até primeira leitura bem-sucedida.
- Percentual de usuários que escaneiam uma nota na primeira sessão.
- Percentual de usuários que entendem o resultado sem onboarding longo.

### Engajamento

- Número médio de notas escaneadas por usuário por semana.
- Frequência de retorno semanal.
- Taxa de abertura da tela de acumulado mensal.

### Viralização

- Taxa de geração de card compartilhável.
- Taxa de compartilhamento por leitura concluída.
- Crescimento orgânico por indicação/social.

### Confiança

- Percentual de leituras com parsing correto.
- Percentual de leituras sinalizadas como “aproximadas”.[cite:30][cite:31]
- Taxa de feedback negativo por percepção de cálculo inconsistente.

## Escopo do MVP

O MVP deve ser propositalmente enxuto e centrado no momento de impacto principal: escanear uma nota e entender o imposto daquela compra.[cite:25]

### Funcionalidades do MVP

- Abertura direta na câmera — zero toque até o escâner.[cite:25]
- Leitura de QR Code da NFC-e via câmera.[cite:27][cite:38]
- Consulta ao portal da SEFAZ estadual e parsing do XML da nota fiscal.[cite:27][cite:38]
- Extração de dados essenciais: estabelecimento, data, valor total e valor tributário (campo `<vTotTrib>` do XML).[cite:31][cite:36]
- Fallback para cálculo via tabela IBPT pública (cruzamento por NCM) quando `<vTotTrib>` não estiver disponível.[cite:30][cite:31]
- Fallback secundário por alíquota média de setor via CNAE, quando NCM também não estiver disponível.
- Classificação automática de categoria por CNAE do estabelecimento, sem input do usuário.
- Exibição da camada Fato, Contexto e Impacto.[cite:25][cite:31]
- Barra de confiança visual (alta / média / baixa) exibida junto ao resultado — não apenas em texto.[cite:30][cite:31]
- Histórico local com linha do tempo visual (gráfico de barras por dia, semana e mês).[cite:25]
- Acumulado de tributos por dia, semana e mês.[cite:25]
- Geração de card compartilhável com layout simples e forte.[cite:25]
- Card “Dia do Imposto”: notificação push no último dia do mês abrindo card com resumo mensal calculado e pronto para compartilhar.[cite:25]
- Tela “O que é esse imposto”: micro-card educativo acessível por tap em qualquer tributo listado, explicando em 2 linhas o que é e quem arrecada.
- Widget de tela inicial (Android/iOS) exibindo acumulado do dia ou do mês sem precisar abrir o app.
- Tela “Como calculamos” com transparência metodológica.[cite:30][cite:31]
- Repositório open-source com README claro e arquitetura inicial documentada.[cite:25]

### Fora do MVP

- Integração bancária.
- OCR de cupom sem QR Code.
- Login obrigatório.
- Nuvem e sincronização entre dispositivos.
- Cashback.
- Planejamento financeiro completo.
- Gamificação complexa com badges e pontuação.
- Múltiplos perfis e recursos sociais internos.
- Mapa de calor por bairro/cidade (dados agregados anonimizados).
- Contador coletivo público de tributos rastreados.
- Entrada manual de valor por categoria (sem QR Code).
- Leitura e cálculo de tributos por produto individual (requer precisão por NCM/UF/regime tributário que a estrutura atual não entrega com confiança suficiente — candidato a versão futura com suporte de IA).

## Fluxo principal do usuário

### Fluxo ideal

1. Usuário abre o app diretamente na câmera (sem toque intermediário).
2. App lê o QR Code da NFC-e.[cite:27][cite:38]
3. App consulta o portal da SEFAZ e processa o XML da nota, classificando automaticamente a categoria pelo CNAE do estabelecimento.
4. App exibe o resultado em 3 camadas:
   - Fato: quanto de tributo há na compra.[cite:31][cite:36]
   - Contexto: quanto isso representa em porcentagem.[cite:31]
   - Impacto: o que isso representa no acumulado do usuário.[cite:25]
5. Usuário pode salvar no histórico e gerar card compartilhável.[cite:25]

### Requisitos de experiência

- App abre diretamente na câmera — zero toque até o escâner.
- Texto simples, sem linguagem tributária difícil.
- Resultado legível em poucos segundos.
- Compartilhamento acessível sem esforço extra.
- Classificação de categoria automática por CNAE, sem input do usuário.

## Telas do MVP

- Câmera/scan como tela inicial (abertura direta).
- Tela de processamento.
- Tela de resultado da compra (camadas Fato, Contexto e Impacto + barra de confiança visual).
- Histórico local com linha do tempo visual (gráfico de barras por dia/semana/mês).
- Tela de resumo do período.
- Card “Dia do Imposto” — exibido com notificação push no último dia do mês, com resumo pronto para compartilhar.
- Tela de compartilhamento/card.
- Tela “O que é esse imposto” — micro-card educativo acessível por tap em qualquer tributo.
- Tela “Como calculamos”.
- Tela “Sobre o projeto / open-source”.

## Requisitos funcionais

### Leitura e captura

- O app deve abrir diretamente na câmera, sem tela intermediária.
- O app deve ler QR Code de NFC-e com boa velocidade em ambiente comum.[cite:27][cite:38]
- O app deve aceitar reescaneamento rápido em caso de falha.
- O app deve exibir fallback claro quando a consulta do QR Code não puder ser processada.

### Processamento

- O app deve consultar o portal da SEFAZ estadual a partir da URL contida no QR Code.
- O app deve fazer parsing do XML da nota e extrair o campo `<vTotTrib>` como fonte primária do valor tributário.[cite:31][cite:36]
- Quando `<vTotTrib>` não estiver disponível, o app deve calcular o tributo aproximado cruzando os códigos NCM dos itens com a tabela IBPT pública.[cite:30][cite:31]
- Quando NCM também não estiver disponível, o app deve aplicar alíquota média por setor usando o CNAE do estabelecimento como fallback de último recurso.
- O app deve identificar qual camada de processamento foi usada e exibir o nível de confiança correspondente.
- O app deve deixar explícito quando o dado for estimado/aproximado.[cite:30][cite:31][cite:40]

### Apresentação

- O app deve exibir sempre Fato, Contexto e Impacto.
- O app deve exibir barra de confiança visual (alta / média / baixa) junto a cada resultado.
- O app deve exibir acumulado diário, semanal e mensal com representação gráfica (linha do tempo visual).
- O app deve gerar card em formato visual próprio para compartilhamento.
- O app deve enviar notificação push no último dia do mês com o card “Dia do Imposto” pronto para compartilhar.
- Qualquer tributo listado deve ser tapeável, abrindo micro-card “O que é esse imposto” em linguagem comum.
- O app deve oferecer widget de tela inicial (Android/iOS) com acumulado do dia ou do mês.

### Persistência

- O usuário deve poder manter histórico local das leituras no dispositivo.
- O histórico deve ser dispensável para usar o app pela primeira vez.
- O histórico local deve evitar duplicidade usando a identidade da NFC-e, derivada da chave de acesso, e não comparação de preço, tributo, percentual, estabelecimento ou horário.
- O usuário deve poder remover leituras individuais do histórico local quando quiser corrigir uma leitura indevida ou um registro antigo duplicado.

## Requisitos não funcionais

- Mobile-first.
- Android como prioridade inicial.[cite:25]
- UX extremamente simples.
- Boa performance no fluxo de escaneamento.
- Design legível em ambientes externos.
- Privacidade clara sobre o que é salvo localmente.
- Código aberto com documentação para contribuição.

## Precisão e metodologia

O app deve tratar com muito cuidado a comunicação sobre precisão. Em muitos contextos, a informação exibida ao consumidor é o **valor aproximado dos tributos**, e não necessariamente um valor contábil absoluto final em todos os cenários.[cite:30][cite:31][cite:40]

### Regra de comunicação

- Nunca afirmar “imposto exato” como padrão.
- Preferir “tributos aproximados” quando essa for a natureza do dado.[cite:30][cite:31]
- Explicar a metodologia em linguagem comum.
- Exibir rótulos de confiança quando necessário.

### Camadas de confiança sugeridas

- Alta confiança: valor extraído diretamente do campo `<vTotTrib>` do XML da NFC-e.
- Média confiança: valor calculado por cruzamento de NCM com tabela IBPT pública.
- Baixa confiança: valor estimado por alíquota média de setor via CNAE; o app deve sinalizar claramente.

### Arquitetura de parsing (custo zero)

O processamento da nota é inteiramente local e determinístico — sem IA, sem API paga. O fluxo de parsing segue três camadas em cascata:

1. **XML first:** o app lê o campo `<vTotTrib>` diretamente do XML retornado pela SEFAZ. Fonte mais confiável.
2. **NCM + IBPT:** quando `<vTotTrib>` não está disponível, o app cruza os códigos NCM dos itens da nota com a tabela IBPT pública (atualizada semestralmente, mantida no repositório pela comunidade).
3. **CNAE fallback:** quando nem o XML completo nem o NCM estão acessíveis, o app aplica uma alíquota média por setor com base no CNAE do estabelecimento.

As requisições ao portal da SEFAZ são feitas diretamente do dispositivo do usuário, sem servidor intermediário. A tabela IBPT fica estática no bundle do app. Custo de infraestrutura: zero.

## Compartilhamento social

O compartilhamento é parte central da estratégia de crescimento do produto.[cite:25] O app deve gerar cards verticais e quadrados com identidade forte, leitura imediata e mensagem emocional curta.[cite:25]

### Estruturas de card sugeridas

- “Nesta compra, R$ X foram tributos aproximados.”[cite:31]
- “Hoje, já foram R$ X em tributos nas minhas compras.”[cite:25]
- “Neste mês, já paguei R$ X em tributos no consumo.”[cite:25]
- “Supermercado é a categoria que mais drenou tributos no meu mês.”[cite:25]
- **Card “Dia do Imposto”** (acionado via notificação push no último dia do mês): “Em [mês], você pagou R$ X em tributos nas suas compras. Isso equivale a X dias trabalhando só para o governo.”

### Características do card

- Fonte grande.
- Pouco texto.
- Valor em destaque máximo.
- Selo/open-source discreto.
- CTA opcional: “Veja quanto imposto existe nas suas compras”.
- A versão inicial do card de leitura individual não deve mostrar nome do estabelecimento, chave de acesso, URL completa do QR Code, documento do emitente, HTML/XML ou itens da compra.
- A assinatura visual deve deixar claro que o projeto é open-source e foi desenvolvido por Richard Wollyce.

## Estratégia open-source

O projeto deve nascer com a narrativa de utilidade pública digital e transparência metodológica.[cite:25] O open-source não é apenas licença de código; ele é parte da credibilidade do projeto.[cite:25]

### Pilares open-source

- Código auditável.
- Metodologia aberta.
- Issues abertas para parsing e regras por estado/variações de consulta.[cite:27][cite:32]
- Guia de contribuição simples.
- Roadmap público.
- Identidade visual e copy documentadas para colaboração.

### Estrutura inicial de repositório

- `apps/mobile`
- `packages/core`
- `packages/parsers`
- `packages/ui`
- `docs/methodology`
- `docs/brand`
- `CONTRIBUTING.md`
- `README.md`
- `ROADMAP.md`

## Stack recomendada

### Recomendação principal

- Expo
- React Native
- TypeScript

Essa stack é a mais coerente para acelerar desenvolvimento Android com baixa fricção, boa comunidade e maior facilidade de contribuição para um projeto open-source liderado por alguém já forte em React/TypeScript.[cite:4][cite:25]

### Bibliotecas e blocos prováveis

- Leitura de câmera/QR Code no ecossistema Expo.
- Geração de imagem/card no cliente ou via camada simples compartilhada.
- Persistência local leve para histórico.
- Camada de parser separada e testável.

### Arquitetura inicial sugerida

- Camada de UI desacoplada do parser.
- Funções puras para transformar nota em payload de exibição.
- Módulo próprio para cálculo/contextualização/insights.
- Sistema de templates para cards compartilháveis.

## Estratégia de linguagem

A voz do produto deve ser simples, clara, humana e forte.[cite:25] O aplicativo não deve soar como software fiscal, portal governamental ou app contábil.[cite:25]

### Características da linguagem

- Frases curtas.
- Vocabulário comum.
- Impacto emocional sem jargão técnico.
- Tom firme, não professoral.
- Transparência quando houver aproximação/estimativa.[cite:30][cite:31]

### Exemplos de microcopy

- “Escaneie sua nota.”
- “Veja quanto imposto existe nessa compra.”
- “Tributos aproximados desta compra.”[cite:31]
- “Isso representa X% do valor pago.”[cite:31]
- “No mês, isso já virou X% do salário mínimo.”[cite:25]

## Riscos principais

### Riscos técnicos

- Variação entre páginas de consulta de NFC-e por UF ou implementação.[cite:27][cite:32]
- Inconsistência na disponibilidade do valor tributário no retorno consultado.[cite:30][cite:31]
- Dificuldade de parsing robusto em todos os cenários.
- Restrições de acesso, CORS ou inconsistências em consultas públicas.

### Riscos de percepção

- Ser percebido como ideológico demais e perder público amplo.
- Ser atacado por suposta imprecisão se não comunicar bem o termo “aproximado”.[cite:30][cite:31]
- Parecer panfletário antes de parecer útil.

### Mitigações

- Priorizar fato visual e clareza metodológica.[cite:31][cite:34]
- Sinalizar nível de confiança.
- Começar com subset de cenários bem suportados.
- Manter tela “Como calculamos” acessível e clara.[cite:30][cite:31]

## Distribuição pública e domínios

O MVP público deve separar o acesso direto ao app da página institucional do projeto:

- **`qr.richardwollyce.com`:** acesso direto ao app web, com experiência mobile-first semelhante ao app instalado. Esse domínio deve abrir o scanner como fluxo principal e usar HTTPS para permitir câmera no navegador.
- **`qrinfo.richardwollyce.com`:** landing page futura com informação sobre o projeto, por que ele foi feito, como funciona, metodologia, links para usar via web, baixar o APK, acessar o GitHub e consultar a política de privacidade. Essa landing page não faz parte da Sprint 4.

Para o APK público, o projeto não deve versionar binários dentro do repositório. O caminho seguro é gerar o APK com EAS pelo perfil `preview`, publicar o arquivo como asset em uma GitHub Release versionada e incluir checksum SHA-256, changelog, commit SHA e link do build EAS. Arquivos `.apk`, `.aab`, keystores, service accounts e credenciais devem continuar fora do Git.

## Estado implementado até a Sprint 4

- **App web publicado:** `qr.richardwollyce.com` está configurado como acesso direto ao app.
- **Card compartilhável da leitura individual:** gera PNG vertical 9:16 com valor da compra, tributos aproximados, percentual, confiança, metodologia curta, CTA e assinatura `Open-source • Desenvolvido por Richard Wollyce`.
- **Cards de acumulado:** Hoje, Semana, Mês e Ano geram cards próprios a partir do histórico local.
- **Compartilhamento com imagem:** Android/iOS usam share sheet nativo; web/PWA usa `navigator.share({ files })` quando disponível; navegadores sem suporte baixam o PNG.
- **Ações sociais:** WhatsApp, Instagram, X, Copiar e Download aparecem alinhados na prévia do card. WhatsApp/X por web usam texto + link; imagem anexada depende do share sheet do sistema. Instagram usa share sheet quando possível e fallback por download.
- **Privacidade do card:** nenhum card inclui estabelecimento, chave de acesso, URL da NFC-e, documento do emitente, HTML/XML ou itens da compra.
- **Distribuição APK planejada:** APK deve ser publicado em GitHub Releases, nunca commitado no repositório.

## Próximas etapas do MVP público

- **Validação Android físico e web HTTPS:** testar câmera, consulta, proxy web, áreas seguras do layout, persistência local e compartilhamento de imagem em aparelho real e no domínio final.
- **Tela curta "Como calculamos":** explicar em linguagem comum a origem dos dados, o termo "tributos aproximados", a camada de confiança e a limitação inicial do suporte real a NFC-e de SP.
- **Preparação de publicação pública:** finalizar README, política de privacidade publicada, screenshots, Data Safety da Play Store, APK em GitHub Release e checklist de release.
- **Landing page informativa:** implementar futuramente `qrinfo.richardwollyce.com` com explicação do projeto, metodologia, links para app web, GitHub, APK e política de privacidade.

## Roadmap sugerido

### Fase 1 — Prova de conceito

- Ler QR Code.
- Processar alguns cenários reais.
- Exibir resultado simples.
- Validar UX e clareza da mensagem.

### Fase 2 — MVP público

- Histórico local.
- Acumulado por período.
- Card compartilhável.
- Tela de metodologia.
- Repositório público organizado.

### Fase 3 — Expansão

- Melhorias de parsing e cobertura de mais variações de documentos por UF.
- Ranking pessoal de categorias: onde o usuário mais paga imposto no mês.
- Entrada manual de valor por categoria, como fallback para compras sem QR Code (delivery, feiras, serviços).
- Mapa de calor por bairro/cidade com dados anonimizados e consentidos.
- Contador coletivo público de tributos rastreados pelos usuários.
- Templates múltiplos de compartilhamento.
- Melhorias de acessibilidade e internacionalização estrutural.

### Fase futura — com suporte de IA

- Leitura de tributo por produto individual: usar modelo de linguagem com acesso a dados em tempo real (NCM + regime tributário + UF + substituição tributária) para estimar a carga por item com confiança suficiente para exibição ao usuário.
- OCR de cupom fiscal impresso sem QR Code.

## Critérios de aceite do MVP

- Um usuário comum consegue escanear uma nota e entender o resultado sem ajuda externa.
- O fluxo principal cabe em poucos passos.
- O app sempre mostra Fato, Contexto e Impacto.
- O card compartilhável é gerado com clareza visual.
- A metodologia deixa claro quando o valor é aproximado.[cite:30][cite:31]
- O projeto pode ser instalado, executado e contribuído por terceiros com documentação mínima adequada.[cite:25]

## Resumo executivo para IA de código

Construir um aplicativo mobile open-source, com prioridade para Android, usando Expo + React Native + TypeScript, cujo objetivo é permitir que qualquer pessoa escaneie o QR Code de uma NFC-e e veja, de forma simples, clara e compartilhável, quanto imposto aproximado existe em cada compra do dia a dia.[cite:25][cite:27][cite:31]

O produto deve focar em conscientização popular, não em contabilidade formal. A experiência precisa ser extremamente simples, com ênfase em três camadas de comunicação: Fato, Contexto e Impacto.[cite:25] O MVP deve incluir leitura de QR Code, processamento dos dados essenciais, exibição do valor tributário disponível/aproximado, histórico local básico, acumulado do período, geração de card compartilhável e tela de metodologia explicando a origem e o nível de confiança dos dados.[cite:30][cite:31]
