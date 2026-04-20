# Arquitetura, Seguranca e Privacidade do MVP

Status: MVP de 21/04/2026.

## Escopo

O QR Imposto MVP consulta NFC-e de compras de consumo e mostra os tributos aproximados presentes na propria nota fiscal. Nesta versao, o suporte real de consulta publica e limitado a NFC-e de SP.

Outras UFs podem aparecer em testes automatizados apenas como fixtures sinteticas. Esses testes nao significam suporte produtivo nacional.

O uso funcional do MVP e feito pelo aplicativo nativo Android. O site `qr.richardwollyce.com` serve apenas como guia publico, canal de informacao e ponto de download do APK.

## Sem Login e Sem Conta

O app nao tem cadastro, login, senha, conta de usuario ou identificador proprio de usuario no MVP.

Como nao existe login, o historico nao sincroniza entre aparelhos. Se a pessoa trocar de celular, desinstalar o app ou limpar os dados do app, o historico local pode ser perdido.

## Historico Local

O historico fica salvo somente no dispositivo da pessoa, usando armazenamento local do app Android.

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

## Retencao Server-Side

A politica de retencao server-side do MVP e zero retencao propria.

O projeto nao mantem backend proprio para conta, historico, banco de dados ou proxy de consulta fiscal. A landing page publica nao processa QR Code, nao usa camera e nao persiste dados fiscais.

Ainda podem existir logs tecnicos automaticos da plataforma de hospedagem da landing page, como metodo HTTP, caminho, status e metadados operacionais. A landing nao deve colocar dados fiscais ou identificadores completos nesses logs.

## Dados Reais em Repositorio

Dados reais de NFC-e nao devem ser commitados sem sanitizacao.

Fotos, QR Codes reais, HTML de consulta publica e XML real podem conter dados sensiveis ou identificadores fiscais. Para testes versionados, a preferencia e usar fixtures sinteticas ou trechos minimos sanitizados.

## Declaracao Publica

Para o MVP, a comunicacao publica deve ser consistente com estes pontos:

- o app Android usa a camera para ler QR Code da NFC-e;
- o app consulta a pagina publica da NFC-e para encontrar valor total e tributos aproximados;
- o historico e local no dispositivo;
- nao ha login;
- nao ha venda de dados;
- nao ha sincronizacao em nuvem;
- `qr.richardwollyce.com` e o dominio oficial para informacao, duvidas, guia de instalacao e download;
- SP e a unica UF com suporte real declarado nesta versao.
