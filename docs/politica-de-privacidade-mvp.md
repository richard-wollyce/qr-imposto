# Politica de Privacidade - QR Imposto

Ultima atualizacao: 22/04/2026.

## O que o app faz

O QR Imposto le QR Codes de NFC-e de compras de consumo e mostra os tributos aproximados informados na nota fiscal.

O suporte real de consulta fora de SP ainda depende de testes com NFC-es de diferentes estados.

O uso funcional acontece pelo aplicativo nativo Android. O site `qr.richardwollyce.com` serve como guia publico, canal de informacao e ponto de download do APK.

## Dados tratados

O app pode tratar os seguintes dados para funcionar:

- imagem da camera apenas no momento da leitura do QR Code;
- URL publica HTTPS da NFC-e lida do QR Code;
- dados exibidos na consulta publica da NFC-e, como estabelecimento, valor total e tributos aproximados;
- resumo local das leituras feitas no dispositivo.

## Permissao de camera

A permissao `android.permission.CAMERA` e usada somente para ler o QR Code da NFC-e.

O app nao salva fotos ou videos da camera e nao envia imagens para servidor proprio.

O app usa a leitura da camera para identificar a URL publica HTTPS da NFC-e e iniciar a consulta necessaria para mostrar os valores da nota.

Ao escanear uma nota, o app transmite essa URL para a pagina publica da SEFAZ ou Secretaria da Fazenda responsavel pela NFC-e. Essa transmissao e feita somente por HTTPS. URLs HTTP sao bloqueadas no fluxo produtivo.

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

A consulta da NFC-e envia a URL publica da nota para o portal publico da SEFAZ ou Secretaria da Fazenda responsavel, exclusivamente para buscar os dados necessarios ao funcionamento do app. O QR Imposto nao mantem servidor proprio nessa consulta.

Cards de compartilhamento sao gerados apenas quando a pessoa usa a acao de compartilhar. Esses cards mostram resumo de valores e nao incluem URL completa do QR Code, chave completa de acesso, HTML, XML ou itens da compra.

## Retencao

Nao ha retencao propria server-side no MVP.

Dados locais permanecem somente no dispositivo ate que a pessoa limpe o historico no app, desinstale o app ou apague os dados locais do app.

## Desenvolvedor e contato

O QR Imposto e mantido por Richard Wollyce.

Para pedidos sobre privacidade ou seguranca, use o canal publico do projeto no GitHub em `https://github.com/richard-wollyce/qr-imposto` ou as informacoes disponibilizadas em `qr.richardwollyce.com`.
