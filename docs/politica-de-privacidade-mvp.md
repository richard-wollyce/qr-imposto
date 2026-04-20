# Politica de Privacidade - QR Imposto MVP

Ultima atualizacao: 20/04/2026.

## O que o app faz

O QR Imposto le QR Codes de NFC-e de compras de consumo e mostra os tributos aproximados informados na nota fiscal.

Nesta versao MVP, o suporte real de consulta e limitado a NFC-e de SP.

## Dados tratados

O app pode tratar os seguintes dados para funcionar:

- imagem da camera apenas no momento da leitura do QR Code;
- URL publica da NFC-e lida do QR Code;
- dados exibidos na consulta publica da NFC-e, como estabelecimento, valor total e tributos aproximados;
- resumo local das leituras feitas no dispositivo ou navegador.

## Historico local

O historico do MVP fica salvo localmente no dispositivo ou navegador. Ele nao e sincronizado em nuvem e nao depende de login.

O historico salva apenas resumo da leitura: data, estabelecimento quando disponivel, valor total, tributos aproximados, percentual, confianca e fonte tecnica.

O historico nao salva URL completa do QR Code, chave completa de acesso, HTML completo, XML completo ou itens da compra.

## Servidor temporario na web

Na versao web, o QR Imposto usa um proxy temporario na Vercel para consultar a pagina publica da NFC-e de SP quando o navegador bloquear chamadas diretas por CORS.

Esse proxy nao cria conta, nao grava banco de dados, nao salva historico, nao grava arquivos e nao persiste URL completa, chave completa, HTML, XML ou conteudo da compra.

## Login e identificacao

O MVP nao tem login, cadastro, senha ou conta de usuario.

## Compartilhamento e venda de dados

O QR Imposto MVP nao vende dados pessoais.

O QR Imposto MVP nao compartilha historico local com terceiros.

## Retencao

Nao ha retencao propria server-side no MVP.

Dados locais permanecem somente no dispositivo ou navegador ate que a pessoa limpe o historico no app, desinstale o app ou apague os dados locais do navegador.

## Contato

Para pedidos sobre privacidade ou seguranca, use o canal publico do projeto no GitHub quando o repositorio estiver publicado.
