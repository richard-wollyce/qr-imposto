# Politica de Privacidade - QR Imposto MVP

Ultima atualizacao: 20/04/2026.

## O que o app faz

O QR Imposto le QR Codes de NFC-e de compras de consumo e mostra os tributos aproximados informados na nota fiscal.

Nesta versao MVP, o suporte real de consulta e limitado a NFC-e de SP.

O uso funcional acontece pelo aplicativo nativo Android. O site `qr.richardwollyce.com` serve como guia publico, canal de informacao e ponto de download do APK.

## Dados tratados

O app pode tratar os seguintes dados para funcionar:

- imagem da camera apenas no momento da leitura do QR Code;
- URL publica da NFC-e lida do QR Code;
- dados exibidos na consulta publica da NFC-e, como estabelecimento, valor total e tributos aproximados;
- resumo local das leituras feitas no dispositivo.

## Historico local

O historico do MVP fica salvo localmente no dispositivo. Ele nao e sincronizado em nuvem e nao depende de login.

O historico salva apenas resumo da leitura: data, estabelecimento quando disponivel, valor total, tributos aproximados, percentual, confianca e fonte tecnica.

O historico nao salva URL completa do QR Code, chave completa de acesso, HTML completo, XML completo ou itens da compra.

## Site publico

O site `qr.richardwollyce.com` nao le QR Code, nao usa camera, nao consulta NFC-e e nao mantem servidor proprio para processar dados fiscais. Ele informa sobre o projeto, orienta a instalacao e direciona para o APK oficial no GitHub Releases.

## Login e identificacao

O MVP nao tem login, cadastro, senha ou conta de usuario.

## Compartilhamento e venda de dados

O QR Imposto MVP nao vende dados pessoais.

O QR Imposto MVP nao compartilha historico local com terceiros.

## Retencao

Nao ha retencao propria server-side no MVP.

Dados locais permanecem somente no dispositivo ate que a pessoa limpe o historico no app, desinstale o app ou apague os dados locais do app.

## Contato

Para pedidos sobre privacidade ou seguranca, use o canal publico do projeto no GitHub ou as informacoes disponibilizadas em `qr.richardwollyce.com`.
