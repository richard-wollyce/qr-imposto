# Arquitetura e Design - QR Imposto

## Decisões Principais

O QR Imposto começa como um app **mobile-first** em Expo, React Native e TypeScript.

Essa decisão privilegia velocidade de aprendizado, menor atrito de ambiente e reutilização de TypeScript. O risco mais importante da primeira versão não é renderizar telas complexas, mas provar que QR codes reais de NFC-e podem ser lidos, consultados e transformados em uma mensagem compreensível sobre tributos aproximados.

## Por Que Expo + React Native

Expo reduz o custo inicial de câmera, permissões, build Android e testes em dispositivo físico. Isso é importante porque este é o primeiro app mobile de produção do projeto.

React Native mantém a possibilidade de iOS sem reescrever a aplicação. TypeScript ajuda a manter a lógica fiscal auditável, testável e mais segura para contribuição open-source.

Kotlin com Compose seria uma escolha forte para Android nativo, mas aumentaria a curva inicial e deixaria a futura versão iOS para uma segunda base de código. Por isso fica como opção futura apenas se a PoC provar limitações graves no Expo.

## Camadas

### App Mobile

Responsável por câmera, permissões, estados de interface e apresentação do resultado.

Não deve conter regra fiscal espalhada. A tela chama os pacotes de parsing e cálculo, recebe um resultado normalizado e mostra Fato, Contexto e Impacto.

### Core

Responsável por tipos, formatação, cálculo de percentual, nível de confiança e mensagens de apresentação.

Essa camada não conhece câmera, rede nem React Native.

### Parsers

Responsável por interpretar QR Code, validar URL, consultar a página pública e extrair dados da NFC-e quando disponíveis.

Essa camada trata o QR Code como entrada não confiável. Apenas URLs HTTP/HTTPS são aceitas.

## Fluxo da PoC

1. Usuário abre o app.
2. App pede permissão de câmera se necessário.
3. Scanner lê o QR Code.
4. Parser valida e normaliza a URL.
5. Consulta pública da NFC-e é carregada.
6. Parser procura valor total e tributos aproximados.
7. Core calcula o percentual.
8. UI exibe resultado simples e metodologia curta.

## Design Mobile-First

O usuário provavelmente está com pressa, em pé ou perto do caixa. A experiência precisa funcionar com uma mão e poucos segundos de atenção.

Decisões:

- abrir direto no scanner;
- usar alto contraste;
- evitar onboarding na PoC;
- usar valores grandes;
- priorizar uma mensagem por tela;
- exibir erros recuperáveis com ação clara;
- evitar jargão fiscal.

## Privacidade

A PoC não cria conta, não envia dados para backend próprio e não salva histórico local.

QR codes e páginas de consulta podem conter dados de compra. Por isso, fixtures reais devem ser tratadas como material sensível durante o desenvolvimento. Antes de publicação open-source, exemplos precisam ser mascarados ou substituídos por fixtures sintéticas.

## Android CLI

O Android CLI anunciado pelo Google em abril de 2026 pode ajudar em tarefas de ambiente, SDK, emulador e verificação. Ele não substitui Expo porque o projeto base é React Native, não Android nativo.

Decisão: usar Android CLI como ferramenta auxiliar opcional, não como dependência de arquitetura.

## Critérios Para Reavaliar

Reavaliar Expo + React Native se:

- a leitura de QR Code for instável em dispositivos Android reais;
- portais de NFC-e exigirem recursos nativos difíceis de acessar;
- performance da câmera ou do parsing bloquear o fluxo;
- publicação em loja exigir customizações nativas frequentes.

Reavaliar o parser se:

- os exemplos reais mostrarem HTML muito divergente por UF;
- nenhum portal expuser tributos aproximados em texto ou XML;
- consulta pública exigir captcha ou sessão.
