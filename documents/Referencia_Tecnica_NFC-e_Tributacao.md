# Referência Técnica Informativa - NFC-e e Tributação no Consumo

Documento de referência de domínio para o projeto **QR Imposto**.

Este material tem caráter informativo. Ele descreve conceitos fiscais relevantes para entender notas fiscais de compra no Brasil e a informação de tributos aproximados exibida ao consumidor.

## 1. O Que é NFC-e

NFC-e significa **Nota Fiscal de Consumidor Eletrônica**.

É um documento fiscal eletrônico usado em operações de venda presencial ou entrega ao consumidor final, como compras em supermercados, farmácias, postos de combustível, lojas de roupas e comércio varejista em geral.

A NFC-e substitui modelos antigos de cupom fiscal em papel e tem validade jurídica como documento eletrônico autorizado pela Secretaria da Fazenda.

Características gerais:

- é emitida por empresas varejistas;
- registra uma venda ao consumidor final;
- possui chave de acesso;
- pode ser consultada publicamente pelo consumidor;
- costuma ser representada ao consumidor por um DANFE NFC-e impresso ou digital;
- inclui um QR Code para facilitar a consulta.

## 2. DANFE NFC-e

DANFE NFC-e significa **Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica**.

O DANFE não é a nota fiscal eletrônica em si. Ele é uma representação simplificada da NFC-e para o consumidor.

Normalmente o DANFE NFC-e contém:

- identificação do estabelecimento;
- CNPJ do emitente;
- data e hora da compra;
- lista resumida de produtos;
- valor total;
- forma de pagamento;
- chave de acesso;
- QR Code de consulta;
- mensagem sobre tributos aproximados, quando informada.

O QR Code existe para permitir que o consumidor consulte a NFC-e no portal da Secretaria da Fazenda.

## 3. QR Code da NFC-e

O QR Code da NFC-e geralmente contém uma URL de consulta pública.

Essa URL pode apontar para um portal estadual ou ambiente autorizado a exibir os dados da NFC-e. Como a NFC-e é administrada pelas Secretarias de Fazenda, os endereços e formatos podem variar por unidade federativa.

Informações comuns associadas ao QR Code:

- chave de acesso da NFC-e;
- versão do QR Code;
- ambiente do documento;
- parâmetros de validação;
- endereço do portal de consulta.

Nem todo portal exibe os mesmos dados da mesma forma. Alguns apresentam uma página HTML para consulta visual. Outros permitem acesso a informações mais estruturadas. A disponibilidade de campos fiscais detalhados depende do portal, da UF e do tipo de resposta pública.

## 4. Chave de Acesso

A chave de acesso é um número de 44 dígitos que identifica uma NF-e ou NFC-e.

Ela carrega informações codificadas sobre:

- UF do documento;
- ano e mês;
- CNPJ do emitente;
- modelo do documento;
- série;
- número;
- tipo do documento;
- código numérico;
- dígito verificador.

Na NFC-e, a chave de acesso permite consultar a nota no portal autorizado. Ela não deve ser confundida com CPF do consumidor nem com dados bancários.

## 5. XML da NFC-e

A NFC-e possui uma estrutura eletrônica baseada em XML.

O XML contém os dados fiscais completos do documento, como emitente, produtos, totais, tributos e informações de autorização.

Campos importantes para entendimento do QR Imposto:

| Campo | Significado |
| --- | --- |
| `vNF` | Valor total da nota fiscal |
| `vProd` | Valor total dos produtos |
| `vDesc` | Valor de descontos |
| `vTotTrib` | Valor aproximado total dos tributos |
| `NCM` | Classificação fiscal da mercadoria |
| `xNome` | Nome do emitente |
| `CNPJ` | CNPJ do emitente |
| `dhEmi` | Data e hora do documento |

O campo `vTotTrib` é especialmente relevante porque representa o valor aproximado dos tributos incidentes sobre a compra, conforme informado no documento fiscal.

## 6. Valor Aproximado dos Tributos

A legislação brasileira determina que documentos fiscais ou equivalentes informem ao consumidor o valor aproximado correspondente à totalidade dos tributos federais, estaduais e municipais que influenciam a formação do preço de venda.

Essa obrigação está associada à Lei 12.741/2012, conhecida popularmente como lei da transparência fiscal.

Ponto central:

- a informação é de **valor aproximado**;
- não deve ser interpretada como cálculo contábil exato da operação;
- o objetivo é dar transparência ao consumidor sobre a carga tributária embutida no preço.

Na prática, a NFC-e pode exibir uma mensagem como:

> Tributos aproximados: R$ X,XX

ou uma variação semelhante.

## 7. Percentual de Tributos na Compra

O percentual de tributos aproximados em uma compra é a relação entre o valor aproximado dos tributos e o valor total pago.

Fórmula conceitual:

> percentual de tributos aproximados = tributos aproximados / valor total da nota

Exemplo informativo:

- valor total da compra: R$ 100,00;
- tributos aproximados: R$ 22,00;
- percentual aproximado: 22%.

Esse percentual ajuda o consumidor a entender o peso relativo dos tributos naquela compra específica.

## 8. Tributos de Consumo Mais Comuns

A composição tributária de uma compra pode variar conforme produto, estado, regime tributário da empresa e regras específicas.

Os tributos abaixo são comuns em discussões sobre consumo e formação de preço.

### ICMS

ICMS significa **Imposto sobre Circulação de Mercadorias e Serviços**.

É um tributo estadual e costuma ser um dos principais tributos sobre mercadorias no varejo.

Características gerais:

- incide sobre circulação de mercadorias;
- a alíquota varia por estado e tipo de produto;
- pode envolver substituição tributária em algumas cadeias;
- é relevante em compras de mercado, roupas, eletrônicos, combustível e outros bens.

### PIS

PIS significa **Programa de Integração Social**.

É uma contribuição federal que pode incidir sobre receita ou faturamento, conforme o regime tributário da empresa.

Características gerais:

- aparece na composição tributária federal;
- pode seguir regime cumulativo ou não cumulativo;
- no Simples Nacional, costuma estar incluído no recolhimento unificado.

### COFINS

COFINS significa **Contribuição para o Financiamento da Seguridade Social**.

É uma contribuição federal relacionada à receita ou faturamento.

Características gerais:

- tem relação próxima com o PIS;
- pode seguir regime cumulativo ou não cumulativo;
- influencia a formação de preço de muitos produtos e serviços.

### IPI

IPI significa **Imposto sobre Produtos Industrializados**.

É um tributo federal relacionado a produtos industrializados.

Características gerais:

- pode incidir na saída da indústria ou importação;
- a alíquota varia conforme a classificação do produto;
- seu peso pode ser percebido no preço final, mesmo quando o consumidor compra no varejo.

### CIDE

CIDE significa **Contribuição de Intervenção no Domínio Econômico**.

No consumo cotidiano, costuma ser lembrada principalmente em discussões sobre combustíveis.

Características gerais:

- é federal;
- pode incidir sobre combustíveis;
- seu impacto para o consumidor aparece indiretamente na formação do preço.

### ISS

ISS significa **Imposto Sobre Serviços**.

É um tributo municipal sobre prestação de serviços. Ele não é o foco inicial do QR Imposto, que começa por NFC-e de compras de mercadorias no varejo.

## 9. NCM

NCM significa **Nomenclatura Comum do Mercosul**.

É um código usado para classificar mercadorias.

Na nota fiscal, o NCM ajuda a identificar a natureza fiscal do produto. A partir dele, é possível consultar tabelas e regras tributárias associadas à mercadoria.

Para fins de transparência ao consumidor, o NCM pode ser útil quando o valor aproximado dos tributos não aparece claramente no documento consultado. Ainda assim, qualquer cálculo por NCM deve ser tratado como estimativa e exige cuidado metodológico.

## 10. IBPT

IBPT significa **Instituto Brasileiro de Planejamento e Tributação**.

O IBPT é conhecido por disponibilizar tabelas de carga tributária média aproximada por produto e serviço, frequentemente usadas para atender à Lei 12.741/2012.

No contexto de consumo, tabelas desse tipo ajudam estabelecimentos a informar valores aproximados de tributos ao consumidor.

Pontos de atenção:

- os valores são aproximações;
- a tabela precisa estar atualizada;
- o resultado pode variar por NCM, UF e tipo de mercadoria;
- não substitui apuração fiscal formal.

## 11. Limitações de Precisão

O QR Imposto deve tratar a informação tributária como aproximação.

Motivos:

- o preço final pode refletir tributos em diferentes etapas da cadeia;
- algumas mercadorias usam substituição tributária;
- regimes tributários variam entre empresas;
- alíquotas mudam por produto e por UF;
- a consulta pública pode não expor todos os detalhes do XML;
- o campo exibido ao consumidor já pode ter sido calculado por metodologia aproximada.

Por isso, a comunicação correta é:

- "tributos aproximados";
- "valor informado na nota";
- "estimativa de carga tributária".

Comunicações a evitar:

- "imposto exato";
- "valor real pago ao governo";
- "cálculo contábil definitivo".

## 12. Reforma Tributária e Mudanças Futuras

A tributação sobre consumo no Brasil está em processo de mudança por causa da reforma tributária.

Novos tributos e campos podem aparecer nos documentos fiscais durante o período de transição, como CBS e IBS.

Essa transição pode afetar:

- campos disponíveis na NFC-e;
- forma de exibição dos tributos;
- regras de cálculo;
- nomenclatura usada nos documentos fiscais;
- tabelas de classificação tributária.

Qualquer leitura de tributos no consumo deve considerar que documentos fiscais eletrônicos evoluem com notas técnicas, atos normativos e mudanças de layout.

## 13. Referências Oficiais e Públicas

- Portal NFC-e SVRS: https://dfe-portal.svrs.rs.gov.br/Nfce
- Manual DANFE e QR Code NFC-e: https://moc.sped.fazenda.pr.gov.br/DanfeQrCodeNFCe.html
- Portal Nacional NF-e: https://www.nfe.fazenda.gov.br
- Lei 12.741/2012: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12741.htm
- Portal SPED: https://sped.rfb.gov.br
