# Resultados dos QR Codes de Teste

Data da validação: 2026-04-19.

## Arquivos

| Arquivo | UF | Portal | Total | Tributos aproximados | Percentual | Fonte |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `qr-examples/1.png` | SP | `www.nfce.fazenda.sp.gov.br` | R$ 30,20 | R$ 10,20 | 33,8% | Consulta pública |
| `qr-examples/2.png` | SP | `www.nfce.fazenda.sp.gov.br` | R$ 132,20 | R$ 36,89 | 27,9% | Consulta pública |

## Observações

- Os dois arquivos têm extensão `.png`, mas o conteúdo real é JPEG.
- As imagens são fotos de QR Code em papel, com ruído e desfoque. O leitor de testes usa pré-processamento simples para recorte e binarização.
- Os dois exemplos são do mesmo estado e do mesmo portal público de NFC-e.
- A consulta pública de SP expôs o valor total e a informação de tributos totais incidentes.
- O parser precisou evitar confundir o número da Lei 12.741/2012 com valor monetário.

## Próxima Cobertura Recomendada

Para aumentar a confiança do parser, os próximos exemplos devem vir de pelo menos uma UF diferente de SP e, se possível, de outro tipo de estabelecimento.
