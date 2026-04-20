# Plano de Implementação - QR Imposto

## Resumo

- Nome oficial do app: **QR Imposto**.
- Escopo confirmado: leitura de **NFC-e de compras de consumo**, como mercado, farmácia, posto e loja de roupa.
- A pasta `qr-examples` será usada como fonte inicial de testes com os 2 QR codes reais adicionados ao projeto.
- A PoC será enxuta: scanner, QR Code real, parsing/extração do valor total e `vTotTrib`, e exibição de quanto da compra é tributo aproximado.
- O objetivo do primeiro ciclo é provar a viabilidade técnica e de UX antes de expandir para histórico, compartilhamento, widgets e notificações.

## Mudanças Nos Documentos

- Criar este documento como registro do plano aprovado antes da implementação.
- Substituir o documento `Referencia_Tecnica_NFS-e_Tributacao.md` por uma referência informativa correta de NFC-e.
- Renomear a referência para `Referencia_Tecnica_NFC-e_Tributacao.md`.
- Remover do documento técnico antigo qualquer conteúdo sobre emissão de nota, RPS, SOAP, certificado digital, comandos, fluxos de sistema, features ou instruções de código.
- Manter a referência nova com caráter informativo sobre NFC-e, DANFE NFC-e, QR Code, chave de acesso, consulta pública, XML, campos fiscais úteis, `vNF`, `vTotTrib`, NCM, Lei 12.741/2012 e limitações de precisão.

## Escopo da PoC

A PoC do QR Imposto deve responder uma pergunta simples:

> Em uma compra real, quanto do valor pago aparece como tributos aproximados na NFC-e?

Inclui:

- App mobile Expo + React Native + TypeScript.
- Tela inicial direta no scanner.
- Leitura de QR Code via câmera.
- Leitura de imagens de QR Code da pasta `qr-examples` em testes automatizados.
- Normalização da URL da NFC-e.
- Extração de dados essenciais quando disponíveis: estabelecimento, data, valor total e tributos aproximados.
- Cálculo do percentual de tributos sobre a compra.
- Tela de resultado com Fato, Contexto e Impacto.
- Mensagem metodológica curta deixando claro que o valor é aproximado.

Não inclui na PoC:

- Login.
- Backend.
- Sincronização em nuvem.
- Histórico persistente.
- Card compartilhável.
- Widget.
- Push mensal "Dia do Imposto".
- Fallback IBPT/NCM completo.
- Fallback por CNAE.
- OCR de cupom sem QR Code.
- Leitura de tributos por item individual.

## Fases

### Fase 1 - PoC Técnica e de UX

- Provar leitura de QR Code e parsing de NFC-e com exemplos reais.
- Exibir resultado simples, rápido e compreensível.
- Documentar quais portais/UFs funcionam com os exemplos iniciais.
- Identificar se mais QR codes reais serão necessários.

### Fase 2 - MVP Público

- Persistência local de histórico.
- Acumulados por dia, semana e mês.
- Card compartilhável.
- Tela de metodologia mais completa.
- Melhorias de cobertura por UF.
- README, contribuição e roadmap open-source.

### Fase 3 - Expansão

- Fallback via IBPT/NCM.
- Categorias por estabelecimento ou CNAE quando houver base confiável.
- Ranking pessoal de categorias.
- Widgets e notificações locais.
- Melhorias de acessibilidade e polimento visual.

## Decisões de Arquitetura

### Stack

Decisão: **Expo + React Native + TypeScript**.

Motivos:

- Reduz fricção para um primeiro app mobile de produção.
- Permite começar pelo Android sem fechar a porta para iOS.
- Reaproveita conhecimento e ecossistema TypeScript.
- Facilita contribuição open-source.
- Evita começar com Kotlin/Compose antes de provar o risco principal: leitura e parsing de NFC-e.

### Estrutura Inicial

- `apps/mobile`: app Expo.
- `packages/core`: tipos, cálculo, normalização e geração de mensagens.
- `packages/parsers`: parsing de QR/NFC-e e adaptadores por fonte/UF.
- `documents`: PRD, plano e referências de domínio.
- `qr-examples`: QR codes reais usados como fixtures privadas/iniciais de validação.

Não criar `packages/ui` na PoC. A UI fica dentro do app mobile e só será extraída se houver repetição real.

### Fluxo Técnico

1. Scanner ou imagem em `qr-examples`.
2. URL NFC-e.
3. Normalização do QR.
4. Consulta real ou fixture de conteúdo.
5. Extração de dados.
6. Cálculo do percentual.
7. Tela de resultado.

Separar lógica fiscal da UI é importante porque:

- facilita testes automatizados;
- melhora auditoria open-source;
- permite ajustar parsing por UF sem mexer em tela;
- evita que regras fiscais fiquem espalhadas no app.

## Decisões de Design Mobile-First

- O app abre direto na câmera porque o momento de uso é rápido: o usuário acabou de comprar e quer entender a nota.
- A tela de resultado deve priorizar valor grande, percentual e explicação curta.
- O uso esperado é com uma mão, em pé, perto do caixa, com pressa e às vezes em ambiente externo.
- O design deve ter contraste alto, fontes legíveis e estados claros de permissão, processamento, erro e sucesso.
- A linguagem deve ser simples e firme, sem jargão fiscal.
- O app deve usar "tributos aproximados" como padrão e evitar qualquer promessa de "imposto exato".

## Android SDK e Ferramentas Google

### Android CLI

Em 16/04/2026, o Google anunciou o Android CLI em preview para facilitar fluxos de desenvolvimento Android por terminal e agentes.

Decisão para o QR Imposto:

- Usar como ferramenta auxiliar opcional para ambiente, SDK, emulador e verificação Android.
- Não usar como base do scaffold, porque `android create` gera projeto Android nativo e não um app Expo/React Native.
- Manter Expo/EAS como caminho principal de build e desenvolvimento.

### Firebase AI Logic com Inferência Híbrida

Em 17/04/2026, o Google anunciou recursos experimentais de inferência híbrida via Firebase AI Logic.

Decisão para o QR Imposto:

- Não usar na PoC.
- O cálculo tributário precisa ser determinístico, auditável e sem IA.
- IA pode ser revisitada futuramente para OCR, acessibilidade ou explicações educativas, mas não para inventar valores de tributo.

## Riscos Técnicos

- Portais estaduais de NFC-e podem variar em HTML, endpoint, parâmetros, disponibilidade e restrições de acesso.
- Alguns QR codes podem abrir páginas que não expõem XML completo.
- Alguns retornos podem não conter `vTotTrib` de forma estruturada.
- QR codes antigos podem estar indisponíveis.
- Portais podem exigir sessão, captcha ou bloquear chamadas automatizadas.
- Dois exemplos iniciais podem não cobrir variação suficiente de UF ou layout.

## Testes

### Unitários

- Parsing da URL/QR.
- Extração de chave e parâmetros.
- Normalização de valores monetários.
- Cálculo de percentual.
- Classificação de confiança.
- Textos "Fato, Contexto e Impacto".

### Com `qr-examples`

- Validar leitura dos 2 QR codes iniciais.
- Identificar UF, portal e estrutura de cada NFC-e.
- Verificar se a consulta pública expõe valor total e tributos aproximados.
- Registrar dependência de portal estadual quando houver.
- Pedir mais exemplos apenas se os 2 não cobrirem variação suficiente.

### Documentais

- Confirmar que este plano existe e usa o nome QR Imposto.
- Confirmar que a referência técnica fala de NFC-e, não NFS-e.
- Procurar e remover termos indevidos no novo documento de referência: RPS, SOAP, certificado digital, comandos, emissão, agente e feature roadmap.
- Validar que a referência explica tributos e percentuais sem virar instrução de código.

## Critério de Aceite da PoC

Com pelo menos um QR real suportado em `qr-examples`, o usuário deve ver:

- valor total da compra;
- tributos aproximados;
- percentual da compra correspondente a tributos;
- nível de confiança;
- explicação curta da origem do dado.

## Referências Consultadas

- [Android CLI e ferramentas para agentes - Android Developers Blog, 16/04/2026](https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html)
- [Agent tools and resources - Android Developers, atualizado em 17/04/2026](https://developer.android.com/tools/agents)
- [Firebase AI Logic hybrid inference - Android Developers Blog, 17/04/2026](https://android-developers.googleblog.com/2026/04/Hybrid-inference-and-new-AI-models-are-coming-to-Android.html)
- [SDK Platform release notes - Android Developers](https://developer.android.com/studio/releases/platforms)
- [Guide to app architecture - Android Developers](https://developer.android.com/topic/architecture)
- [Guide to Android app modularization - Android Developers](https://developer.android.com/topic/modularization)
- [Mobile UI Design - Android Developers](https://developer.android.com/design/ui/mobile)
- [Portal NFC-e SVRS](https://dfe-portal.svrs.rs.gov.br/Nfce)
- [Manual DANFE e QR Code NFC-e](https://moc.sped.fazenda.pr.gov.br/DanfeQrCodeNFCe.html)
- [Lei 12.741/2012 - Planalto](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12741.htm)
