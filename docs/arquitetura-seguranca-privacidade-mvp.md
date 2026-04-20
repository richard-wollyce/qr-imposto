# Arquitetura, Seguranca e Privacidade do MVP

Status: MVP de 21/04/2026.

## Escopo

O QR Imposto MVP consulta NFC-e de compras de consumo e mostra os tributos aproximados presentes na propria nota fiscal. Nesta versao, o suporte real de consulta publica e limitado a NFC-e de SP.

Outras UFs podem aparecer em testes automatizados apenas como fixtures sinteticas. Esses testes nao significam suporte produtivo nacional.

## Sem Login e Sem Conta

O app nao tem cadastro, login, senha, conta de usuario ou identificador proprio de usuario no MVP.

Como nao existe login, o historico nao sincroniza entre aparelhos. Se a pessoa trocar de celular, desinstalar o app, limpar os dados do app, trocar de navegador ou limpar o armazenamento do navegador, o historico local pode ser perdido.

## Historico Local

O historico fica salvo somente no dispositivo ou navegador da pessoa, usando armazenamento local do app.

O historico salva apenas um resumo da leitura:

- data e hora da leitura;
- UF identificada, quando disponivel;
- nome do estabelecimento, quando disponivel;
- valor total da compra;
- valor de tributos aproximados;
- percentual calculado;
- nivel de confianca;
- fonte tecnica do dado, como XML ou pagina publica.

O historico local nao salva:

- URL completa do QR Code;
- chave completa de acesso da NFC-e;
- HTML retornado pela SEFAZ;
- XML completo da NFC-e;
- itens da compra;
- documento completo do emitente;
- qualquer dado de login, porque login nao existe no MVP.

## Consulta Direta no Android

No app Android, a consulta da NFC-e pode ser feita diretamente para a URL publica do QR Code da NFC-e, apos validacao basica da URL e da UF suportada.

O fluxo produtivo do MVP bloqueia UFs diferentes de SP antes da consulta publica.

## Proxy Temporario na Web

Na versao web, navegadores podem bloquear chamadas diretas para portais estaduais por CORS. Para contornar isso, a versao web usa uma funcao serverless temporaria na Vercel em `/api/nfce-proxy`.

Esse proxy existe apenas para buscar a pagina publica da NFC-e de SP e devolver o texto ao app web. Ele nao e um backend de conta, historico ou banco de dados.

O proxy:

- aceita somente requisicoes `POST`;
- aceita somente URLs HTTP/HTTPS;
- aceita somente hosts allowlisted de SP;
- rejeita credenciais na URL e portas customizadas;
- usa timeout curto;
- limita o tamanho da resposta;
- nao grava banco de dados;
- nao grava arquivo;
- nao cria sessao;
- nao usa fila;
- nao persiste URL, chave, HTML, XML ou resultado fiscal.

## Logs e Retencao Server-Side

A politica de retencao server-side do MVP e zero retencao propria.

O codigo do proxy nao deve registrar URL completa, chave completa de acesso, HTML da NFC-e, XML da NFC-e ou conteudo da compra em logs de aplicacao.

Ainda podem existir logs tecnicos automaticos da plataforma de hospedagem, como metodo HTTP, caminho `/api/nfce-proxy`, status e metadados operacionais. A implementacao deve evitar colocar dados fiscais ou identificadores completos nesses logs.

## Dados Reais em Repositorio

Dados reais de NFC-e nao devem ser commitados sem sanitizacao.

Fotos, QR Codes reais, HTML de consulta publica e XML real podem conter dados sensiveis ou identificadores fiscais. Para testes versionados, a preferencia e usar fixtures sinteticas ou trechos minimos sanitizados.

## Seguranca do Proxy

O proxy usa allowlist de host, validacao de protocolo, bloqueio de porta customizada, bloqueio de usuario/senha na URL, timeout, limite de corpo de requisicao e limite de tamanho de resposta.

Essas medidas reduzem risco de SSRF, abuso como proxy aberto, vazamento acidental e consumo excessivo de recursos.

## Declaracao para Play Store e Web

Para o MVP, a comunicacao publica deve ser consistente com estes pontos:

- o app usa a camera para ler QR Code da NFC-e;
- o app consulta a pagina publica da NFC-e para encontrar valor total e tributos aproximados;
- o historico e local;
- nao ha login;
- nao ha venda de dados;
- nao ha sincronizacao em nuvem;
- a versao web usa um proxy temporario sem persistencia para compatibilidade tecnica;
- SP e a unica UF com suporte real declarado nesta versao.
