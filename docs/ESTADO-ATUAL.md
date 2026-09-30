# Estado atual

Retrato do projeto em **30/09/2026**, para quem vai analisar ou continuar o
desenvolvimento.

## O que está pronto

**Cliente (cardápio)**
- Cardápio com categorias, promoções do dia e navegação por seções.
- Montagem de pizza: fatias, adicionais, bebida acompanhante, quantidade.
- Carrinho "Meu pedido": editar, remover, quantidade, sugestão de bebidas.
- Checkout com nome, WhatsApp, endereço e observações; pedido registrado na API
  e enviado ao WhatsApp da loja com número (`#0042`).

**Lojista (painel)**
- Login por chave administrativa.
- Fila de pedidos em tempo quase real (10 s), com alerta de pedido novo.
- Etapas Recebido → Confirmado → Em preparo → Saiu para entrega → Concluído, com
  aviso ao cliente pelo WhatsApp nas etapas intermediárias.
- Histórico de pedidos concluídos com busca e paginação.
- Cadastro de produtos, alteração de preço e exclusão.

**Base técnica**
- Preço calculado no servidor, em centavos, com a mesma função do front.
- Validação de entrada com zod, rate limit, CORS restrito, `no-store`.
- Arquitetura em camadas (SOLID) na API e nos fronts; 103 testes automatizados.

## Limitações conhecidas

| Tema | Situação | Impacto |
|---|---|---|
| Avisos no WhatsApp | Por link `wa.me`: o lojista toca em "enviar" em cada aviso | Não é automático |
| Autenticação do painel | Uma única chave compartilhada, sem usuários nem registro de quem fez o quê | Trocar a chave desloga todos; sem auditoria |
| Telas do painel | Categorias, adicionais e promoções têm API e client prontos, **mas sem tela** | Hoje só via API/seed |
| Promoções informativas | "Usar esta promoção" só anota na mensagem; não há desconto calculado | Desconto aplicado manualmente no atendimento |
| Taxa de entrega | Não existe | Total não inclui frete |
| Pagamento | Não há pagamento online | Combinado no WhatsApp |
| Fotos dos produtos | Não há upload; cards usam um desenho genérico | — |
| Carrinho | Só na memória do navegador | Recarregar a página esvazia o carrinho |
| Rate limit | Contadores na memória do processo | Com várias instâncias, cada uma conta separado |
| Tempo real | Polling de 10 s | Atraso de até 10 s para ver pedido novo |
| Cancelamento | Não há status "Cancelado" | Pedido desistido precisa ser concluído |
| Testes de interface | Componentes React sem testes automatizados | Regras testadas em `domain/`, telas verificadas manualmente |
| Horário de funcionamento | Não existe | O site aceita pedidos a qualquer hora |

## Próximos passos sugeridos

1. **Status "Cancelado"** com motivo, fora do fluxo normal.
2. **Telas do painel** para categorias, adicionais e promoções (a API já existe).
3. **Taxa de entrega** e **horário de funcionamento**.
4. **Promoção "Compre e Ganhe"** com barra de progresso no carrinho — regra
   validada na API.
5. **Upload de fotos** dos produtos.
6. **Envio automático no WhatsApp** pela API oficial (WhatsApp Business Cloud,
   da Meta): exige conta Meta Business verificada, número dedicado, modelos de
   mensagem aprovados e cobrança por conversa. No código, a API chamaria
   `customerStatusMessage` ao mudar o status; nenhuma tela muda.
7. **Usuários do painel** (login individual) no lugar da chave única.
8. **Carrinho persistido** no `localStorage`.

## Histórico

| Commit | Data | Mudança |
|---|---|---|
| `e6071a8` | 29/09/2026 | Estado inicial do projeto |
| `7c0844f` | 29/09/2026 | Correções: preço único no shared, pedidos com promoção, rate limit, rotas de categorias/promoções, avisos de configuração, testes |
| `73adddd` | 29/09/2026 | API reorganizada em camadas (SOLID), validação com zod |
| `f23c436` | 29/09/2026 | Fronts reorganizados em domain/api/hooks/components |
| `b953424` | 30/09/2026 | Gerenciamento de pedidos no painel (número, etapas, fila, histórico) |
| `354e29a` | 30/09/2026 | Etapas Confirmado/Saiu para entrega e avisos ao cliente no WhatsApp |
| `627d1b9` | 30/09/2026 | Novo carrinho "Meu pedido" |

### Incidente registrado

Em 30/09/2026 um comando do Prisma que usa *shadow database* foi apontado para o
banco de desenvolvimento no Neon e apagou os dados. O banco foi restaurado pelo
histórico do Neon para o estado imediatamente anterior, sem perda. O cuidado para
não repetir está em [DESENVOLVIMENTO](DESENVOLVIMENTO.md#migrações-leia-antes).
