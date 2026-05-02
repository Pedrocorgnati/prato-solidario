# Prato Solidário

## Premissa e Visão

O Prato Solidário é uma plataforma sem fins lucrativos com o objetivo de eliminar o desperdício de alimentos ao mesmo tempo em que combate a fome. A ideia central é criar uma ponte digital entre quem tem comida sobrando — restaurantes, lanchonetes e pessoas físicas — e quem precisa de uma refeição, incluindo moradores de rua, famílias em vulnerabilidade social e ONGs que redistribuem alimentos.

A plataforma nasce como empresa social, sustentada financeiramente por banners de publicidade vendidos no aplicativo. Não há cobrança de taxas sobre doações, mensalidades ou qualquer exploração comercial do ato solidário. O único mecanismo de receita são anúncios pagos por parceiros e patrocinadores, além de um benefício automático concedido aos restaurantes doadores: a cada doação realizada, o restaurante ganha um dia de exibição gratuita de banner no app.

A visão de longo prazo é construir uma rede nacional de doação de refeições que opere com mínima intervenção humana — automatizando o máximo possível de fluxos, mas mantendo um painel administrativo para ações que exigem julgamento humano (aprovação de parceiros, gestão de denúncias, moderação de banners). O objetivo é que a operação diária não dependa de uma equipe dedicada, mas que decisões pontuais sejam tomadas por gestores quando necessário. A plataforma deve ser acessível a qualquer pessoa — inclusive àquelas sem smartphone, sem internet banda larga ou sem cadastro em plataformas digitais.

## Públicos-alvo

O Prato Solidário atende quatro perfis principais de usuários:

- Doador pessoa física: cidadão comum que preparou comida em excesso em casa e quer doar. Precisa de cadastro para garantir rastreabilidade e responsabilidade sobre a doação.
- Doador restaurante ou estabelecimento: negócio de alimentação com sobras regulares de marmitas ou refeições do dia. Também exige cadastro. Tem benefício direto no sistema: cada doação gera um dia de banner gratuito no aplicativo.
- Receptor individual ou grupo familiar: pessoa ou família em situação de vulnerabilidade que quer buscar uma refeição disponível nas proximidades. O acesso à página de retirada é deliberadamente simples, sem cadastro obrigatório, acessível mesmo em dispositivos antigos ou sem internet rápida. Existe um cadastro opcional (e-mail + localização salva) para receptores que desejam receber notificações push de doações próximas (como o Alerta de Fim de Expediente) e ter acesso à recuperação de códigos perdidos pelo perfil.
- ONG ou agente redistribuidor: organização ou voluntário que realiza o intermédio — acessa o sistema, gera códigos e leva as refeições até pessoas que não têm acesso a dispositivos, como moradores de rua em viadutos. O agente redistribuidor pode pedir múltiplas porções em um único acesso. Diferente do receptor comum, a ONG tem cadastro obrigatório com dados mínimos (nome da organização, e-mail, CPF ou CNPJ do responsável) e recebe uma flag interna de "agente redistribuidor" que a isenta do sistema de bloqueio anti-abuso. Essa distinção técnica é necessária para que o sistema consiga aplicar a isenção de forma automática.

- Patrocinador de marmita: pessoa física ou empresa que compra refeições de marmitarias parceiras e as injeta no fluxo de doação da plataforma. Não precisa preparar nem entregar alimentos — contribui financeiramente.
- Marmitaria parceira: pequeno negócio de alimentação que se cadastra para receber pagamentos via plataforma e produz as refeições compradas por patrocinadores.

O perfil prioritário de impacto é o receptor em situação de rua ou vulnerabilidade extrema, atendido tanto diretamente quanto por meio de ONGs parceiras. O perfil prioritário de crescimento é o restaurante doador, pois ele combina volume de doação com incentivo de visibilidade (banner gratuito).

## Concorrência e Mercado

O Brasil não possui, até o momento, uma plataforma gratuita de matching em tempo real entre doadores de comida pronta e receptores individuais em situação de vulnerabilidade via app mobile. O mercado existente está dividido em dois grupos distintos:

- Iniciativas institucionais físicas: SESC Mesa Brasil e rede de Bancos de Alimentos do MDS operam com coleta física e redistribuição para entidades credenciadas. São lentos, burocráticos e não têm app em tempo real.
- Plataformas tech comerciais: Food To Save (R$ 70M de faturamento em 2024) conecta consumidores a estabelecimentos com sobras, mas vende sacolas com desconto — não é doação gratuita. Too Good To Go e Karma operam no mesmo modelo no exterior. A Comida Invisível (USP/FAO) é a mais próxima de uma plataforma de doação pura, mas conecta restaurantes a ONGs intermediárias, não ao receptor individual. O OLIO (Europa) faz food sharing P2P mas sem foco em vulnerabilidade social.
- Movimentos institucionais 2025: o iFood lançou uma área permanente de doação de refeições em parceria com a ONG Ação da Cidadania, mas o modelo é diferente — o usuário contribui financeiramente, não doa comida diretamente. O MDS elaborou metas em 2024-2025 para ampliar mecanismos de doação alimentar, mas acompanha com cautela apps privados por questões sanitárias. Isso representa uma janela de oportunidade real para plataformas bem estruturadas com rastreabilidade.

O Prato Solidário ocupa um nicho ainda vazio: doação gratuita de comida pronta, em tempo real, acessível ao receptor individual sem cadastro e sem smartphone moderno, com fluxo adicional de patrocínio de marmitas que garante oferta mínima independente de doações espontâneas.

## Proposta de Valor

### Para doadores pessoa física

Processo de doação rápido e sem burocracia. O doador informa quantos pratos tem disponíveis, coloca o endereço e compartilha a localização. A doação fica visível para receptores num raio de 5 km. Não há necessidade de acordar horário ou gerenciar quem vai buscar: o sistema cuida da alocação e gera os códigos de retirada automaticamente.

### Para restaurantes e estabelecimentos

Além da simplificação do processo de doação, o restaurante recebe um benefício direto e imediato: a cada doação concluída, ganha um dia de exibição de banner gratuito no aplicativo. Isso cria um incentivo concreto e recorrente para participar. Restaurantes com doações frequentes acumulam dias de visibilidade sem custo adicional.

### Para receptores

A página de retirada não exige cadastro, não exige smartphone de última geração e não exige internet de alta velocidade. Qualquer pessoa consegue acessar, ver quantas refeições estão disponíveis perto de si, informar o tamanho do grupo e receber um código simples. Esse código pode ser anotado em papel ou escrito no braço — não é necessário ter o telefone em mãos na hora da retirada.

O sistema respeita núcleos familiares: ao solicitar refeições para um grupo, o sistema localiza um ponto com quantidade suficiente e aloca todas as porções juntas, evitando que membros de uma mesma família sejam direcionados para locais diferentes.

### Para ONGs e agentes redistribuidores

A ONG ou voluntário pode acessar o sistema, gerar códigos em nome de grupos e distribuir esses códigos pessoalmente para moradores de rua ou famílias em locais sem acesso à internet. O sistema não diferencia tecnicamente a ONG do receptor final, mas o fluxo de uso é o mesmo — o que muda é que o agente redistribuidor usa o sistema como ferramenta de campo.

### Para patrocinadores e anunciantes

Área dedicada de parceiros no aplicativo, com banners visíveis para todos os usuários da plataforma. O patrocinador associa sua marca a uma causa social concreta, com dados de impacto disponíveis (pratos doados, famílias atendidas, municípios cobertos).

## Fluxo do Doador Pessoa Física

1. Cadastro com nome, e-mail, senha e endereço principal.
2. Login e acesso à tela principal.
3. Clicar em "Quero doar".
4. Informar a quantidade de pratos ou porções disponíveis — pode ser apenas uma marmita. Não há volume mínimo.
5. Informar uma janela de horário em que a retirada poderá ser feita (ex: das 12h às 14h).
6. Confirmar ou ajustar o endereço e ativar o compartilhamento de localização.
7. Doação publicada e disponível para receptores no raio de 5 km.
8. Quando um receptor resgatar o código, o doador recebe uma notificação com o código gerado, para verificar a retirada dentro da janela de horário informada.

## Fluxo do Doador Restaurante

1. Cadastro com dados do estabelecimento: nome, CNPJ ou CPF, endereço, telefone.
2. Login e acesso à área de doação.
3. Clicar em "Quero doar" — a interface do restaurante exibe campos otimizados para volumes maiores (ex: 20 marmitas, 15 porções de almoço).
4. Informar o tipo e quantidade de alimentos disponíveis.
5. Informar a janela de horário disponível para retirada.
6. Confirmar endereço e localização.
7. Doação publicada.
8. A cada doação confirmada, o sistema credita automaticamente 1 dia de exibição de banner gratuito na conta do restaurante.

## Fluxo do Receptor

1. Acesso à página pública de retirada — sem login, sem cadastro obrigatório.
2. O sistema detecta automaticamente a localização do dispositivo (ou o usuário informa manualmente o CEP ou bairro).
3. A tela exibe a quantidade total de refeições disponíveis em um raio de 5 km.
4. O usuário informa o número de pessoas do grupo familiar. O valor padrão é 1. Para usuários sem cadastro, esse número é salvo na memória local do dispositivo (localStorage) para facilitar o próximo acesso.
5. Clicar no botão de solicitar.
6. O sistema identifica o ponto doador mais próximo com quantidade suficiente para atender o grupo inteiro.
7. O sistema gera e exibe o código de retirada.
8. O receptor anota o código e vai ao endereço indicado para fazer a retirada.

## Fluxo do Patrocinador de Marmita

1. Acesso à área de patrocínio no app — disponível tanto para usuários com cadastro quanto sem cadastro.
2. Visualização da lista de marmitarias parceiras com nome, foto, localização e preço por marmita.
3. Seleção de uma marmitaria e definição da quantidade de marmitas que deseja financiar.
4. O sistema calcula o valor total (quantidade x preço da marmita) e exibe o resumo da compra.
5. Redirecionamento para o checkout do Mercado Pago (PIX, cartão de crédito ou débito).
6. Após pagamento confirmado, o sistema gera automaticamente os créditos de refeição vinculados ao endereço da marmitaria.
7. Confirmação por e-mail com resumo da compra e dados de impacto: "Você financiou X marmitas na marmitaria Y. Essas refeições já estão disponíveis para quem precisa."
8. Para patrocinadores com cadastro: o histórico de compras e impacto acumulado fica visível no perfil.

## Fluxo da Marmitaria no Dia a Dia

1. Login no painel da marmitaria.
2. Tela principal exibe: saldo de marmitas disponíveis (créditos patrocinados ainda não retirados), pedidos ativos (códigos gerados aguardando retirada) e histórico de entregas do dia.
3. Quando um receptor apresenta o código, a marmitaria abre a lista de códigos ativos e confirma a entrega tocando no código correspondente — mesmo fluxo de confirmação do doador convencional.
4. Após confirmação, o crédito é consumido e o saldo atualiza em tempo real.
5. Aba de pagamentos: exibe o histórico de pagamentos recebidos via Mercado Pago com data, valor e status (aprovado, pendente, estornado).
6. Configurações: editar horários de retirada, atualizar preço por marmita, trocar foto de perfil, reconectar conta Mercado Pago se necessário.

## Fluxo da ONG e Agente Redistribuidor

1. Cadastro com dados mínimos: nome da organização ou do voluntário, e-mail, CPF ou CNPJ do responsável e senha.
2. Verificação de e-mail.
3. Após confirmação, a conta recebe automaticamente a flag de "agente redistribuidor", que a isenta do sistema de bloqueio anti-abuso.
4. Acesso à mesma página de retirada que receptores comuns, mas com a possibilidade de gerar múltiplos códigos em sequência para distribuição em campo.
5. O agente redistribuidor gera códigos para grupos ou indivíduos e os distribui pessoalmente (anotando em papel, ditando, etc.) em locais sem acesso à internet.
6. Histórico de códigos gerados visível no perfil, para controle interno da ONG.

## Sistema de Código de Retirada

O código de retirada é um identificador simples, legível e memorizável. Seu formato é:

`Dd + tipo + NNNN`

Onde:
- Dd é o dia do mês com dois dígitos (ex: 03, 15, 28)
- tipo identifica a natureza do pedido: "in" para individual ou "f" seguido do número de pessoas para grupo familiar (ex: f2, f4, f6) — sempre em letras minúsculas
- NNNN são quatro caracteres aleatórios — sempre em letras maiúsculas

Exemplos práticos:
- Um indivíduo solicita no dia 15: o código gerado pode ser 15inG92Q
- Uma família de quatro pessoas solicita no dia 15: o código gerado pode ser 15f4G5S7

O código é suficientemente curto para ser ditado verbalmente, anotado em papel ou escrito em qualquer superfície — inclusive na pele, com caneta, no caso de moradores de rua. O receptor leva o código até o ponto de retirada e o apresenta ao doador.

### Confirmação de retirada pelo doador

O doador abre o app e vê uma lista de todos os códigos ativos vinculados à sua doação atual. Quando o receptor apresenta o código, o doador localiza o código correspondente na lista e toca para confirmar a entrega individual. Para doadores com alto volume (restaurantes com dezenas de códigos), existe um botão "Dar baixa em todos" que confirma todas as entregas de uma vez. Esse botão exibe um aviso: "Confirme apenas se todos os receptores retiraram. Confirmações injustas podem gerar bloqueio indevido de receptores." Essa ressalva existe porque a confirmação de retirada sem entrega efetiva dispara o sistema de bloqueio anti-abuso contra o receptor.

O código de retirada expira ao final do dia corrente para doações convencionais. Para refeições patrocinadas (marmitarias parceiras), o código também expira ao final do dia, mas a refeição retorna ao pool de disponíveis — o receptor pode gerar um novo código no dia seguinte.

## Regras de Negócio

### Alocação de refeições e algoritmo de matching

O sistema não aloca refeições de forma sequencial e individual. Quando um grupo de quatro pessoas solicita, o sistema busca um ponto doador com no mínimo quatro refeições disponíveis e reserva as quatro para esse grupo. Isso garante que núcleos familiares não sejam fragmentados — a mãe e os filhos recebem refeições no mesmo local.

O algoritmo de matching prioriza compatibilidade de escala: pedidos individuais (1 pessoa) são direcionados preferencialmente para doações de pessoa física (que tipicamente têm 1-3 porções), enquanto pedidos de grupos familiares (2+ pessoas) são direcionados para doações de restaurantes ou marmitarias (que têm volumes maiores). Essa priorização evita que pedidos individuais esgotem rapidamente o estoque de um restaurante com 20 marmitas, enquanto famílias ficam sem atendimento.

Critério de desempate quando múltiplos doadores estão disponíveis: primeiro por proximidade geográfica, depois por FIFO (doação mais antiga primeiro, para evitar desperdício por envelhecimento).

### Controle de pedidos por receptor

Um receptor individual sem cadastro pode fazer apenas um pedido ativo por vez. Um novo pedido só pode ser feito após a expiração ou a confirmação de retirada do código anterior.

Para grupos familiares sem cadastro, o número de pessoas do grupo é salvo na memória interna do dispositivo. A cada novo acesso, o campo já vem preenchido com o valor anterior, reduzindo a fricção para quem acessa regularmente.

### Sistema de bloqueio anti-abuso

O sistema monitora pedidos por combinação de IP + device fingerprint (para usuários sem cadastro) e por conta (para usuários cadastrados). A combinação de IP com fingerprint do dispositivo resolve o problema de bloqueio injusto em redes Wi-Fi compartilhadas (praças, abrigos, bibliotecas, SESC), onde múltiplos receptores legítimos compartilham o mesmo IP. O bloqueio se aplica ao receptor final — aquele que gerou o código para si próprio e não foi buscar. ONGs e agentes redistribuidores com flag de "agente redistribuidor" são automaticamente isentos de bloqueio, pois não são responsáveis pelo comportamento do morador de rua ou da família que recebeu o código de segunda mão.

Progressão do bloqueio para receptores (com ou sem cadastro):
- Primeiro caso de não retirada: bloqueio de 1 dia.
- Segundo caso: bloqueio de 3 dias.
- Casos subsequentes: escalonamento progressivo.

Quando não há doações disponíveis em um raio de 5 km, o sistema exibe uma mensagem amigável informando que não há refeições disponíveis no momento e sugere tentar novamente mais tarde. Não há redirecionamento automático para raios maiores no MVP.

A lógica de bloqueio é automática, sem necessidade de revisão humana.

### Banner por doação de restaurante

A cada doação confirmada pelo restaurante, o sistema credita automaticamente 1 dia de exibição de banner. Dias acumulados ficam disponíveis em saldo na conta do restaurante. O restaurante pode programar quando usar os dias de banner ou deixar o sistema usar automaticamente.

### Alerta de Fim de Expediente

Restaurantes e doadores têm acesso a um botão rápido de "Sobrou!" na tela principal, acionável quando estão encerrando o dia com marmitas ou porções que precisam sair agora. Ao tocar no botão, o doador informa a quantidade disponível e a janela de retirada (sugestão padrão: 30 minutos). O sistema dispara uma notificação silenciosa para receptores com cadastro opcional (que salvaram e-mail e localização) num raio de 3 km, com a mensagem de urgência. Esse fluxo é mais curto que a publicação de doação convencional — o endereço já está salvo no perfil e a janela é preenchida automaticamente. A ideia é capturar o excedente de fim de expediente que hoje vai para o lixo por falta de tempo para publicar uma doação completa.

### Cancelamento de doação pelo doador

O doador pode cancelar uma doação publicada enquanto nenhum código de retirada ainda tiver sido gerado para ela. Se já houver um código ativo vinculado àquela doação, o cancelamento não é permitido — o compromisso com o receptor é mantido.

### Notificação ao doador

Quando um receptor gera um código vinculado à doação, o doador recebe uma push notification informando que alguém irá buscar a refeição dentro da janela de horário cadastrada. Se o app não estiver instalado ou o push não for recebido, o doador consegue verificar o status pelo app na próxima vez que acessar.

### Sad Paths e Cenários de Exceção

Os cenários negativos abaixo cobrem as situações mais críticas do fluxo de doação e retirada:

- Doador ausente no horário: o receptor chega ao local indicado mas o doador não está. O receptor acessa o app e reporta "Doador ausente". O sistema registra o incidente, libera imediatamente um novo código para o receptor (sem penalizá-lo) e redireciona para o próximo doador disponível. O incidente é logado para o painel admin — reincidências geram alerta para o gestor.

- Janela de horário expira sem retirada: quando a janela cadastrada pelo doador expira e ainda há códigos não confirmados, o sistema envia um push ao doador perguntando se deseja estender a janela por mais 30 minutos. Se o doador aceitar, a janela é estendida. Se não responder ou recusar, os códigos expiram e a doação é encerrada. O receptor não é penalizado nesse cenário — apenas quando há confirmação de não-retirada intencional.

- Código perdido ou esquecido: para receptores sem cadastro, não há recuperação — o código é informação efêmera. Para receptores com cadastro opcional, o perfil exibe uma seção "Meus códigos" com os códigos ativos, permitindo consulta a qualquer momento.

- Código inválido apresentado ao doador: o doador tenta localizar o código na lista de ativos e não encontra. O app exibe mensagem "Código não encontrado ou expirado" e orienta o receptor a gerar um novo código se houver doações disponíveis.

- Nenhuma doação disponível no raio: o sistema exibe mensagem amigável informando que não há refeições disponíveis no momento e sugere tentar novamente mais tarde. Não há redirecionamento automático para raios maiores no MVP.

### Corrente do Bem — Compartilhamento de Impacto

Imediatamente após o doador confirmar a retirada no app, a tela exibe uma mensagem de impacto real gerada com os dados daquela doação — por exemplo: "Sua doação alimentou uma família de 4 pessoas hoje em São Paulo." Abaixo da mensagem, um botão de compartilhar gera automaticamente um card visual para redes sociais com esse dado real, sem identificar o receptor. O doador pode compartilhar com um toque no Instagram, WhatsApp ou onde preferir.

Esse momento — logo após a confirmação — é o pico emocional da experiência do doador. É quando o ato solidário se torna concreto e visível. O compartilhamento orgânico gerado por esse instante é a principal estratégia de crescimento da plataforma, sem custo de marketing.

## Painel Administrativo

O sistema conta com um painel de administração completo, acessível apenas por gestores da plataforma. O painel permite:

- Visualizar métricas de impacto em tempo real (pratos doados, códigos resgatados, doadores ativos).
- Gerir usuários doadores: aprovar, suspender ou excluir cadastros.
- Gerir receptores: visualizar histórico de pedidos e desbloquear manualmente em casos especiais.
- Gerir campanhas de banner: ativar, pausar e controlar a exibição de banners de patrocinadores e restaurantes.
- Gerir parceiros e patrocinadores: cadastrar, editar e remover parceiros da área de patrocínio.

### Fluxo operacional do admin

O admin atua por exceção — a maioria das operações é automática, mas ações pontuais exigem julgamento humano:

- Desbloquear receptor: o admin acessa o histórico do receptor, revisa os incidentes registrados e pode remover o bloqueio manualmente com justificativa.
- Aprovar marmitaria parceira: o admin verifica os dados cadastrais (CNPJ/CPF, endereço, conta MP vinculada) e aprova ou rejeita com feedback.
- Gerenciar denúncia: o admin recebe alertas de incidentes (doador ausente recorrente, receptor com padrão suspeito) e decide a ação (advertência, suspensão, exclusão).
- Gestão de banners: o admin ativa, pausa ou remove campanhas de banner. Define posicionamento e prioridade de exibição.
- Monitorar marmitas acumuladas: quando uma marmitaria tem muitas marmitas patrocinadas não retiradas, o admin pode entrar em contato ou sugerir pausa nas compras.

O painel é totalmente separado da interface pública do aplicativo.

## Monetização e Sustentabilidade Financeira

O Prato Solidário é uma entidade sem fins lucrativos. Não há cobrança sobre doações, não há mensalidade para doadores ou receptores, e não há qualquer forma de monetização sobre o ato solidário em si.

A única fonte de receita da plataforma é a venda de espaços de banner para patrocinadores e anunciantes. Essa receita é usada exclusivamente para manter o app no ar — infraestrutura, hospedagem e custos operacionais. O aplicativo reserva posições fixas de banner na interface, visíveis para todos os usuários. Empresas, comércios locais e marcas que desejam associar sua imagem ao projeto podem contratar esses espaços.

O modelo de pricing de banner será definido no MVP com base no volume de usuários. A estrutura inicial prevê cobrança mensal por posição de banner, com valores acessíveis para comércios locais e pacotes maiores para marcas regionais ou nacionais. O pricing exato será calibrado após o lançamento, com base no tráfego real da plataforma. [TODO: definir faixas de preço após validação de tráfego no MVP]

O benefício de banner gratuito para restaurantes doadores funciona como permuta — o restaurante cede refeições e em troca ganha dias de visibilidade. Esse modelo incentiva a participação e ocupa organicamente parte dos espaços de banner.

### Estimativa de custo operacional do MVP

Os custos de infraestrutura estimados para o MVP são:
- Vercel: tier gratuito (hobby) ou Pro (US$ 20/mês) dependendo do tráfego.
- Supabase: tier gratuito para início, Pro (US$ 25/mês) quando exceder limites.
- Geolocalização: ViaCEP (gratuito) + Mapbox free tier (100.000 req/mês gratuitas) — custo zero no MVP.
- Push notifications: Expo Push API (gratuito, sem limite declarado de subscribers).
- PDF de diploma: `@react-pdf/renderer` rodando em Vercel — custo zero.
- Domínio: ~R$ 40/ano (.com.br).
- Expo: tier gratuito para builds e updates OTA.

Custo estimado total do MVP: R$ 0 a R$ 250/mês, dependendo do tráfego. A receita de 1-2 banners pagos por mês deve cobrir esses custos.

O fluxo de marmitarias parceiras não é uma fonte de receita da plataforma. O dinheiro pago pelo patrocinador de marmita vai integralmente para a marmitaria que produz a refeição. O Prato Solidário atua apenas como intermediador tecnológico gratuito nessa transação, sem tomar parte ou comissão.

## Marmitarias Parceiras e Patrocínio de Marmitas

Marmitarias — pequenos negócios que produzem e vendem marmitas — podem se cadastrar na plataforma como parceiras. Durante o cadastro, a marmitaria informa o valor da sua marmita mais barata e conecta sua conta do Mercado Pago via OAuth (Mercado Pago Connect). Essa vinculação é feita uma única vez e autoriza o Prato Solidário a criar cobranças em nome da marmitaria.

### Fluxo de pagamento

O modelo adotado é o Mercado Pago Connect com pagamento direto na conta da marmitaria:

1. O patrocinador acessa a área de patrocínio no app e escolhe uma marmitaria e a quantidade de marmitas que quer financiar.
2. O Prato Solidário cria uma preferência de pagamento usando as credenciais OAuth da marmitaria parceira.
3. O patrocinador paga via PIX, cartão de crédito ou débito. O valor vai diretamente para a conta Mercado Pago da marmitaria — o Prato Solidário não intermedia nem retém nenhum valor.
4. O Mercado Pago envia um webhook para o endpoint do Prato Solidário confirmando o pagamento aprovado.
5. O Prato Solidário verifica a autenticidade do webhook e, ao confirmar, gera automaticamente a quantidade correspondente de refeições no fluxo de doação, vinculadas ao endereço da marmitaria.
6. As refeições ficam disponíveis imediatamente para receptores no raio de 5 km da marmitaria.

Dessa forma, o Prato Solidário atua exclusivamente como intermediador tecnológico: processa a lógica de negócio (criar a cobrança, ouvir o webhook, liberar os créditos) sem tocar no dinheiro e sem qualquer responsabilidade fiscal sobre a transação.

### Comportamento das refeições patrocinadas

Essas refeições têm comportamento diferente das doações convencionais: não expiram ao final do dia. Se não forem retiradas, continuam disponíveis no dia seguinte até serem resgatadas. Isso garante que nenhuma marmita paga por um patrocinador seja desperdiçada por questão de prazo.

O código de retirada, no entanto, segue a mesma regra de expiração diária. Se o receptor gera um código para uma marmita patrocinada e não vai buscar naquele dia, o código expira ao final do dia mas a refeição retorna automaticamente ao pool de disponíveis. No dia seguinte, o receptor (ou qualquer outro receptor) pode gerar um novo código para aquela mesma refeição. Esse ciclo se repete até que a refeição seja efetivamente retirada.

As refeições patrocinadas ficam disponíveis apenas dentro dos horários de retirada cadastrados pela marmitaria. Fora desse horário, os créditos existem mas não podem gerar códigos.

O fluxo de retirada é idêntico ao das doações convencionais: o receptor gera um código e vai até o endereço da marmitaria para retirar.

## MVP e Escopo Inicial

A primeira versão do Prato Solidário é dividida em funcionalidades core (essenciais para operar) e features de engajamento (diferenciais que podem ser implementadas em paralelo).

### Core do MVP

- Cadastro e login de doadores (pessoa física, restaurante, marmitaria parceira e ONG/agente redistribuidor).
- Cadastro opcional de receptor (e-mail + localização para notificações e recuperação de códigos).
- Fluxo completo de doação: quantidade, janela de horário, endereço, localização.
- Página pública de retirada: sem cadastro obrigatório, geolocalização ou CEP, exibição de disponibilidade em 5km, input de grupo familiar, botão de solicitar.
- Algoritmo de matching com prioridade por compatibilidade de escala (indivíduos para PF, famílias para restaurantes), proximidade e FIFO.
- Geração de código de retirada com o formato Dd+tipo+NNNN.
- Confirmação de retirada pelo doador (lista de códigos ativos + toque para confirmar + botão "dar baixa em todos").
- Sistema automático de crédito de banner para restaurantes doadores.
- Área de parceiros e patrocinadores com exibição de banners.
- Sistema de bloqueio por IP + device fingerprint para receptores sem cadastro que não retiram, com escalonamento progressivo.
- Fluxo de marmitarias parceiras: cadastro, integração Mercado Pago Connect (OAuth), compra por patrocinadores, geração automática de refeições sem expiração diária.
- Push notification ao doador quando um código vinculado à sua doação é gerado.
- Painel administrativo: métricas de impacto, gestão de usuários, banners, parceiros, desbloqueio manual, aprovação de marmitarias.
- Sad paths: doador ausente (report + novo código), código perdido (Meus códigos para cadastrados), janela expirada (push para estender).

### Features de engajamento do MVP

- Landing page institucional: hero, como funciona, contador de impacto em tempo real, mapa de necessidade por bairro, área de parceiros/banners, hall da fama e chamada para download do APK (depende de: API de métricas, mapa de calor).
- Botão "Sobrou!" de alerta de fim de expediente para doadores (depende de: cadastro opcional de receptor para push).
- Corrente do Bem: tela de impacto pós-confirmação com botão de compartilhamento gerado automaticamente.
- Cálculo de impacto ambiental (kg evitados + CO2 equivalente) por doador e no diploma anual.
- Badge mensal automático para maiores doadores por cidade.
- Diploma anual em PDF de alta resolução, gerado e enviado por e-mail (depende de: geração de PDF server-side).
- Opção de o doador aparecer no hall da fama público da landing page.

### Pós-MVP

Ficam para versões posteriores: API pública para integração com outras plataformas solidárias, avaliação de qualidade das refeições por receptores, ampliação automática de raio quando não há doações próximas, relatórios de impacto ESG para empresas, parcerias com prefeituras.

## Princípios de Confiança da Plataforma

O Prato Solidário é construído sobre dois pressupostos fundamentais que moldam todas as decisões de produto:

1. Quem está com fome come o que doarem. O receptor não escolhe o tipo de refeição, não avalia se prefere uma opção ou outra, não cancela porque não gostou do que viria. A fome não tem cardápio.
2. Quem doa é uma pessoa boa. O doador não precisa provar a qualidade do que está oferecendo. Restaurantes e marmitarias que se cadastram na plataforma assumem voluntariamente a responsabilidade de entregar algo digno. A plataforma confia nisso.

Esses dois princípios eliminam deliberadamente funcionalidades comuns em outros apps — avaliação de refeições, descrição detalhada do menu, filtros por tipo de comida, estrelas de qualidade — porque todas essas mecânicas criariam hierarquias entre doações e incentivo a cancelamentos por preferência. O foco é o ato solidário, não a experiência gastronômica.

## Telas e Fluxos de Cadastro

O cadastro é a porta de entrada para doadores, marmitarias, ONGs e patrocinadores. A tela inicial do app apresenta cinco caminhos: Quero Receber, Quero Doar, Marmitaria Parceira, Sou ONG/Voluntário e Patrocinador. O receptor não precisa de cadastro obrigatório e acessa diretamente o fluxo de retirada, mas pode optar por um cadastro simplificado para receber notificações e recuperar códigos.

### Cadastro do Doador Pessoa Física

O doador pessoa física passa por um cadastro simples em três etapas.

Etapa 1 — Dados pessoais: nome completo, e-mail e senha (com confirmação). Abaixo do campo de senha, um checkbox de aceite dos termos de uso e política de privacidade, com link para cada documento.

Etapa 2 — Telefone: número de celular para receber push notifications quando alguém for buscar uma doação. Campo obrigatório, com instrução explicando por que é pedido.

Etapa 3 — Verificação de e-mail: o sistema envia um link de confirmação. O doador acessa o e-mail, clica no link e retorna ao app já autenticado e pronto para doar.

Não há coleta de endereço residencial no cadastro. O endereço de retirada é informado somente no momento da publicação da doação.

### Cadastro do Doador Restaurante ou Estabelecimento

O restaurante passa por cinco etapas de cadastro.

Etapa 1 — Tipo de estabelecimento: o usuário confirma que é um restaurante, lanchonete, catering, padaria ou similar — qualquer negócio de alimentação com excedentes regulares.

Etapa 2 — Dados do estabelecimento: nome fantasia, CPF ou CNPJ (ambos aceitos), telefone de contato, e-mail e senha. O campo de documento tem detecção automática do tipo (CPF ou CNPJ) pela quantidade de dígitos.

Etapa 3 — Endereço: campo de CEP com preenchimento automático dos demais campos (logradouro, bairro, cidade, estado) via API dos Correios. O usuário completa apenas o número e, se necessário, o complemento. O endereço cadastrado aqui é o ponto padrão de retirada, podendo ser ajustado a cada doação publicada.

Etapa 4 — Foto de perfil: campo opcional no MVP para enviar uma foto da fachada ou do logo do estabelecimento. Exibida no perfil público do doador. Incentivada mas não obrigatória.

Etapa 5 — Verificação de e-mail: mesmo fluxo do doador PF. Após confirmação, o restaurante acessa o painel de doações e já pode ver seu saldo de dias de banner disponíveis (começa em zero).

### Cadastro da Marmitaria Parceira

O cadastro da marmitaria é o mais completo, pois envolve a vinculação de conta de pagamento. É dividido em seis etapas, com uma etapa dedicada ao tutorial do Mercado Pago.

Etapa 1 — Dados do negócio: nome fantasia, CPF ou CNPJ (ambos aceitos — inclui MEIs e marmiteiras informais com conta Mercado Pago no CPF), telefone, e-mail e senha.

Etapa 2 — Endereço: CEP com preenchimento automático, número e complemento. Este endereço é o ponto fixo onde os receptores vão buscar as marmitas patrocinadas.

Etapa 3 — Foto de perfil: foto da fachada ou do local de retirada. Exibida na listagem de marmitarias para patrocinadores. Obrigatória neste perfil, pois o patrocinador precisa identificar visualmente onde está comprando.

Etapa 4 — Preço por marmita: campo único com o valor que a marmitaria quer receber por cada marmita doada através da plataforma. Esse valor pode ser abaixo do preço de mercado — a marmitaria pode optar por cobrar apenas o custo de matéria-prima como forma de fazer serviço social. Não há descrição do tipo de marmita: o patrocinador compra "uma marmita desta marmitaria", sem detalhes do que virá. Esse é um princípio fundamental da plataforma — quem está com fome come o que doarem.

Etapa 5 — Horário de retirada: dias da semana e janela de horário em que a marmitaria aceita retiradas. Esses horários serão usados pelo sistema para controlar quando os créditos de marmita ficam disponíveis para receptores gerarem códigos.

Etapa 6 — Vinculação do Mercado Pago: etapa guiada em tela própria, com as seguintes instruções exibidas em sequência visual (estilo tutorial passo a passo):

- Passo 1: "Para receber os pagamentos dos patrocinadores diretamente na sua conta, você precisa ter uma conta no Mercado Pago. Se ainda não tem, crie gratuitamente em mercadopago.com.br antes de continuar."
- Passo 2: "Clique no botão abaixo. Você será redirecionado para o Mercado Pago para autorizar a conexão com o Prato Solidário." — botão de destaque: "Conectar com Mercado Pago".
- Passo 3 (após retorno do OAuth): confirmação visual de que a conta foi vinculada com sucesso, exibindo o nome da conta MP conectada. Botão "Continuar".

O que acontece tecnicamente nessa etapa: o app abre o fluxo OAuth do Mercado Pago Connect. O usuário faz login na conta MP e concede permissão ao Prato Solidário para criar cobranças em seu nome. O Mercado Pago retorna um access token vinculado àquela conta, que é armazenado com segurança pela plataforma. A partir desse momento, quando um patrocinador compra marmitas dessa marmitaria, o pagamento vai direto para a conta MP vinculada. O Prato Solidário recebe apenas o webhook de confirmação e libera os créditos.

Após as seis etapas, verificação de e-mail e acesso ao painel da marmitaria, onde é possível ver o saldo de marmitas disponíveis, o histórico de pedidos e os pagamentos recebidos.

### Cadastro da ONG ou Agente Redistribuidor

O cadastro da ONG é simples e focado em identificação para fins de isenção de bloqueio.

Etapa 1 — Dados da organização: nome da organização (ou nome do voluntário, se pessoa física atuando como redistribuidor), e-mail e senha.

Etapa 2 — Documento: CPF (para voluntários individuais) ou CNPJ (para organizações formalizadas). Ambos são aceitos. O campo tem detecção automática do tipo pela quantidade de dígitos.

Etapa 3 — Verificação de e-mail: mesmo fluxo dos demais perfis.

Após verificação, a conta recebe automaticamente a flag de "agente redistribuidor". Essa flag isenta o usuário do sistema de bloqueio anti-abuso e permite a geração de múltiplos códigos em sequência para distribuição em campo.

### Cadastro Opcional do Receptor

O receptor pode usar a plataforma sem nenhum cadastro. Porém, existe um cadastro opcional simplificado para quem deseja:

- Receber notificações push de doações próximas (especialmente o Alerta de Fim de Expediente).
- Consultar códigos ativos na seção "Meus códigos" (recuperação de código perdido).
- Manter o tamanho do grupo familiar salvo na conta em vez de no localStorage.

O cadastro é mínimo: e-mail, senha e localização preferencial (CEP ou bairro). Não há coleta de nome, documento ou qualquer dado pessoal além do e-mail. A localização é usada exclusivamente para calcular o raio de notificações.

### Cadastro do Patrocinador

O patrocinador pode comprar marmitas com ou sem cadastro prévio.

Sem cadastro: o patrocinador acessa a área de patrocínio, escolhe uma marmitaria pelo nome e localização, informa a quantidade de marmitas que quer financiar, paga via Mercado Pago (PIX, cartão de crédito ou débito) e recebe a confirmação por e-mail. Não há conta criada.

Com cadastro opcional: se o patrocinador quiser acompanhar o histórico de doações, ver quantas refeições já financiou e receber relatórios de impacto ("você financiou 48 marmitas em março"), pode criar uma conta com e-mail e senha. O cadastro é mínimo — apenas nome, e-mail e senha. Sem documentos, sem endereço.

## Experiência e Interfaces

A identidade visual do Prato Solidário é limpa, moderna e minimalista, com uso predominante de verde e branco. O verde reforça a mensagem de bem-estar, saúde e esperança. O branco confere leveza e acessibilidade visual.

A plataforma tem três zonas de experiência distintas:

- Interface do doador: foco em velocidade e clareza. O processo de doação deve ser concluído em menos de um minuto. Sem etapas desnecessárias.
- Interface do receptor: máxima simplicidade. A página de retirada deve funcionar bem mesmo em celulares antigos, conexões lentas e por usuários com baixa familiaridade digital. Texto grande, poucos campos, botão único e prominente.
- Interface do parceiro/anunciante: área institucional com informações sobre impacto, opções de patrocínio e gestão de campanhas de banner.

O aplicativo mobile é o site encapsulado em APK via Expo, mantendo a mesma experiência responsiva do web com adaptações para tela de toque.

## Tecnologia e Deploy

- Frontend: Next.js com App Router e React Server Components.
- Backend: API Routes do próprio Next.js.
- Banco de dados: PostgreSQL gerenciado pelo Supabase.
- ORM: Prisma.
- Autenticação: Supabase Auth (para doadores, ONGs e receptores com cadastro opcional).
- Hospedagem web: Vercel.
- Mobile: APK gerado via Expo (encapsulamento do site responsivo em WebView nativa).
- Mobile-first: design responsivo, otimizado para telas menores.

### Integrações e APIs externas

- Geolocalização: ViaCEP (gratuito) para resolução de CEP em endereço + Mapbox free tier (100.000 requisições/mês gratuitas) para geocoding, cálculo de raio e exibição de mapa. A combinação elimina custo de infraestrutura no MVP.
- Push notifications: Expo Notifications (gratuito, sem limite de subscribers) como canal principal. Arquitetura crítica: o registro de push token ocorre na camada nativa do app Expo (não dentro da WebView). O token é enviado ao backend Supabase e o Expo Push API dispara as notificações. A comunicação entre a camada nativa e a WebView Next.js se dá via `postMessage`.
- Pagamentos: Mercado Pago Connect (OAuth marketplace) para marmitarias parceiras. Contatar o programa Mercado Livre Solidário antes da integração para negociar taxas diferenciadas para ONGs/sem fins lucrativos.
- CEP: API ViaCEP (gratuita) para preenchimento automático de endereço nos formulários de cadastro.
- Diploma em PDF: `@react-pdf/renderer` (gratuito, server-side, sem dependência de browser). Geração rápida (~1-2s) em API Route da Vercel, sem problemas de cold start ou limite de timeout. O template do diploma é um componente React com layout fixo e dados dinâmicos.

## Confiança e Segurança

O sistema é projetado para operar com o mínimo de fricção para receptores, mas com salvaguardas automáticas contra abuso:

- Doadores passam por cadastro com verificação de e-mail.
- Receptores sem cadastro são identificados por combinação de IP + device fingerprint. O histórico de pedidos e não-retiradas é associado a essa combinação, evitando bloqueios injustos em redes Wi-Fi compartilhadas.
- O código de retirada expira no mesmo dia em que foi gerado, eliminando acúmulos ou especulação de vagas.
- Um receptor não pode solicitar novamente enquanto tiver um código ativo não confirmado.
- O sistema de bloqueio é gradual e automático, sem necessidade de intervenção humana.

## Indicadores de Sucesso

As métricas principais de impacto e saúde da plataforma são:

- Número de refeições doadas por dia e por mês.
- Taxa de resgate: proporção de códigos gerados que resultam em retirada efetiva.
- Número de doadores ativos por período (pessoa física e restaurante).
- Número de restaurantes parceiros cadastrados.
- Cobertura geográfica: municípios e bairros com doações ativas.
- Receita de banners: sustentabilidade financeira da operação.

### Métricas do MVP (v1)

As métricas que definem o sucesso da primeira versão são:
- Pelo menos 10 doadores ativos por semana (PF + restaurantes).
- Pelo menos 5 restaurantes parceiros cadastrados.
- Taxa de resgate acima de 60% (códigos gerados que resultam em retirada).
- Pelo menos 1 marmitaria parceira com fluxo de patrocínio funcionando.
- Receita de banners suficiente para cobrir os custos de infraestrutura.

### Métricas de crescimento (v2+)

Para versões posteriores, os indicadores de escala são:
- Cobertura em pelo menos 3 cidades.
- Mais de 100 doadores ativos por semana.
- Parcerias institucionais com prefeituras ou ONGs de alcance nacional.
- Diversificação de receita além de banners (grants, relatórios ESG).

O app deve exibir para doadores, em tempo real, indicadores de impacto acumulado: "você alimentou X famílias" e "evitou X kg de desperdício". A gamificação de impacto aumenta o engajamento e a recorrência de doações — especialmente para restaurantes, que podem ver seu histórico de impacto crescer ao longo do tempo. Esses dados também reforçam o valor percebido pelos patrocinadores de banner.

## Impacto Ambiental

Além do impacto social, o Prato Solidário calcula e exibe o impacto ambiental de cada doação. O sistema usa um peso médio estimado por refeição (padrão: 500g) para calcular o total de alimento desviado do desperdício e o equivalente em CO2 não emitido — baseado em referências públicas do IPCC e da FAO sobre emissões de resíduos orgânicos em aterros.

Cada doador vê no perfil: "Este mês você evitou X kg de desperdício alimentar e X kg de CO2 equivalente." O acumulado anual aparece no diploma e no badge, tornando o reconhecimento concreto em duas dimensões: pessoas alimentadas e planeta preservado.

Esses dados são especialmente valiosos para restaurantes e empresas que precisam documentar ações de sustentabilidade em relatórios ESG — e funcionam como argumento de venda para atrair novos parceiros patrocinadores.

## Mapa de Necessidade por Bairro

O Prato Solidário exibe publicamente um mapa de calor mostrando a distribuição geográfica de pedidos de refeição não atendidos — bairros onde há demanda de receptores mas doações insuficientes. O mapa é atualizado em tempo real e fica visível tanto na landing page quanto dentro do app para doadores.

O objetivo é direcionar doações espontâneas para onde a necessidade é maior, sem depender de campanhas manuais. Um doador que vê que o bairro vizinho tem 34 pedidos não atendidos na semana tem um motivo concreto para agir. Patrocinadores podem usar o mapa para decidir em qual região financiar marmitarias parceiras.

O mapa exibe apenas dados agregados por bairro — nunca localização individual de receptores.

## Compliance Alimentar

O Prato Solidário opera dentro do marco legal da Lei 14.016/2020 (Lei do Bem), que autoriza a doação de alimentos próprios para consumo e isenta o doador de responsabilidade civil e criminal, desde que o alimento esteja dentro do prazo de validade e com condições sanitárias preservadas.

Como plataforma intermediária, o Prato Solidário deve ter cláusulas contratuais claras nos termos de uso dos doadores, definindo que:
- A responsabilidade pelo estado do alimento é do doador até o momento da retirada pelo receptor.
- A plataforma não assume responsabilidade pela qualidade do alimento — mas deve manter logs de rastreabilidade (o que foi doado, por quem, quando e para qual código de retirada) para proteção reputacional e para eventual apoio a investigações sanitárias.

O risco reputacional — um caso de intoxicação midiatizado — é maior que o risco jurídico. Por isso, o sistema deve ser projetado com rastreabilidade desde o MVP, mesmo que os logs não sejam exibidos publicamente.

## Privacidade e Dados

O Prato Solidário coleta dados mínimos e não sensíveis. O endereço armazenado no sistema é o local de retirada das refeições — que pode ser o estabelecimento, a calçada em frente ou qualquer ponto público combinado pelo doador — e não necessariamente a residência do usuário. Receptores sem cadastro não têm nenhum dado pessoal coletado além do IP para o sistema de bloqueio.

A plataforma deve ter termos de uso e política de privacidade claros antes do lançamento público, informando o uso dos dados de localização (apenas para fins de busca de doações próximas) e o uso de IP para controle de abuso.

## Sustentabilidade Financeira de Longo Prazo

No MVP, a única fonte de receita são os banners de patrocinadores. Para garantir a viabilidade da plataforma no longo prazo, as seguintes fontes complementares devem ser avaliadas em versões futuras:

- Grants e editais: BNDES, fundações privadas (Itaú, Bradesco), programas da FAO e do PNUD financiam iniciativas de redução de desperdício alimentar. A política nacional de resíduos orgânicos em elaboração pelo governo federal deve gerar novas chamadas públicas a partir de 2025-2026.
- Relatórios de impacto ESG: empresas doadoras — especialmente restaurantes e redes varejistas — precisam documentar ações de sustentabilidade para relatórios GRI e CDP. A plataforma pode oferecer relatórios automáticos de impacto como serviço pago para o segmento B2B.
- Parcerias com prefeituras: operação da plataforma dentro de programas municipais de segurança alimentar, com contrato de serviço público.

Essas fontes não fazem parte do escopo do MVP mas devem ser consideradas no planejamento de crescimento.

## Go-to-Market e Retenção

### Estratégia de lançamento

A estratégia de lançamento é simultânea: doadores e receptores são divulgados ao mesmo tempo, sem um piloto geograficamente restrito. A comunicação inicial se dará via redes sociais, com ênfase no aspecto de impacto social e na simplicidade do fluxo para doadores.

O principal incentivo para doadores é a facilidade — o processo de doação leva menos de um minuto. Para restaurantes, o benefício adicional de banner gratuito por doação é um diferencial concreto para convencer o primeiro lote de parceiros.

Para aquisição dos primeiros restaurantes parceiros: abordagem direta (porta a porta ou contato telefônico) com foco em restaurantes de bairro que já doam informalmente para moradores de rua. Apresentar o app como ferramenta para organizar o que já fazem, com o benefício adicional de visibilidade via banner.

### Retenção de doadores

- Restaurantes: banner gratuito por doação (incentivo financeiro recorrente) + badge mensal + diploma anual + dados de impacto acumulado no perfil.
- Pessoa física: Corrente do Bem (compartilhamento de impacto pós-doação em redes sociais) + acúmulo de impacto visível no perfil + badge mensal + diploma anual. O pico emocional pós-confirmação é o principal mecanismo de reengajamento — cada doação gera um momento compartilhável que traz o doador de volta.
- Patrocinadores de marmita: relatórios periódicos de impacto ("você financiou X marmitas este mês") + reconhecimento público no hall da fama (se optar).

## Riscos e Mitigações

- Risco: receptor gera código e não retira, desperdiçando a vaga de outra pessoa.
  Mitigação: sistema de bloqueio por IP + device fingerprint com escalonamento progressivo, expiração automática do código ao final do dia.

- Risco: doador cadastrado não está disponível para entregar no horário.
  Mitigação: ao publicar a doação, o doador informa uma janela de horário de retirada. Códigos só são gerados para essa janela.

- Risco: restaurantes exibirem banners sem realizar doações efetivas.
  Mitigação: o crédito de banner só é concedido após a confirmação de retirada pelo doador — não no ato de publicar a doação.

- Risco: uso da plataforma para distribuição de alimentos inadequados ou vencidos.
  Mitigação: no MVP, confiar na responsabilidade do doador com termos de uso claros. Em versões futuras, sistema de avaliação de receptores sobre a qualidade das refeições.

- Risco: marmitas patrocinadas acumuladas sem retirada (não expiram).
  Mitigação: painel admin mostra estoque de marmitas patrocinadas por marmitaria. Se o volume acumulado for muito alto, o sistema pode sugerir ao patrocinador pausar novas compras até o estoque ser consumido.

- Risco: desequilíbrio entre oferta e demanda na fase de lançamento.
  Mitigação: lançamento simultâneo com comunicação em redes sociais. O mecanismo de marmitarias parceiras garante oferta mínima independente de doações espontâneas.

- Risco: aprovação do Mercado Pago Connect pode levar semanas e exigir documentação da entidade.
  Mitigação: iniciar o processo de onboarding no Mercado Pago o mais cedo possível, em paralelo ao desenvolvimento. Preparar documentação da entidade (CNPJ, contrato social, dados do responsável) antes de submeter. Ter um fallback: caso o Connect demore, lançar o MVP sem marmitarias parceiras e adicionar o fluxo quando aprovado.

- Risco: estrutura jurídica indefinida pode bloquear contratos com patrocinadores e a integração com Mercado Pago Connect.
  Mitigação: definir o tipo de entidade (Associação, OSCIP ou Instituto) antes do lançamento. Para o MVP, uma Associação é o caminho mais rápido de formalização. A Lei Complementar 224/2025 alterou regras tributárias para entidades sem fins lucrativos a partir de 2026 — consultar contador ou advogado especializado antes de formalizar. [TODO: consultar advogado para definir tipo de entidade]

## Landing Page Institucional

O Prato Solidário terá uma landing page pública separada da interface do aplicativo, com função de apresentar o projeto, converter visitantes em doadores e atrair parceiros e patrocinadores.

A landing page deve comunicar com clareza e emoção o propósito da plataforma — combater o desperdício de alimentos e a fome ao mesmo tempo. O tom é humano, direto e inspirador. As seções principais da página são:

- Hero com chamada principal: apresentação do conceito em uma frase impactante, com botão de acesso ao app e botão de "Quero ser parceiro".
- Como funciona: explicação visual do fluxo doador → receptor em três ou quatro passos simples, com ilustrações ou ícones.
- Impacto em tempo real: contador público de refeições doadas, famílias atendidas e municípios cobertos — atualizado dinamicamente a partir dos dados reais da plataforma (depende de: API de métricas do backend).
- Área de parceiros e patrocinadores: espaço dedicado a empresas e pessoas que apoiam a plataforma. Exibe logotipos, banners pagos e informações sobre como se tornar parceiro ou patrocinador. Inclui formulário de contato para interessados em anunciar ou patrocinar marmitas.
- Hall da Fama — Maiores Doadores: seção que exibe os doadores que optaram por aparecer publicamente, organizados por cidade e por período. Exibe o badge mensal dos destaques do mês atual e o diploma anual dos campeões do ano por cidade.
- Chamada para download do APK e acesso ao site.
- Rodapé com links institucionais, política de privacidade e termos de uso.

## Sistema de Reconhecimento — Badge e Diploma

O Prato Solidário reconhece seus maiores doadores com dois instrumentos de destaque distintos:

### Badge Mensal

Todo mês, o sistema calcula automaticamente os maiores doadores por cidade — tanto em número de refeições quanto em consistência. Os destaques do mês recebem um badge digital visível no perfil dentro do aplicativo e, caso optem por aparecer no hall da fama da landing page, seu nome ou logo é exibido publicamente na seção correspondente. O badge é renovado a cada mês — quem manter o ritmo mantém o reconhecimento.

### Diploma Anual

Uma vez por ano, o sistema gera e envia virtualmente um diploma personalizado para os maiores doadores do ano por cidade. O diploma é um certificado digital de alta qualidade visual — pensado para ser impresso e colocado na parede, com a mesma dignidade simbólica de um selo Michelin ou de um prêmio de excelência. Pode ser exibido no estabelecimento, nas redes sociais do doador ou guardado como reconhecimento pessoal.

O diploma é enviado por e-mail e disponibilizado para download em PDF em alta resolução. Tanto pessoas físicas quanto jurídicas são elegíveis. O diploma é personalizado com o nome do doador, a cidade, o período de referência e os dados de impacto acumulado no ano (ex: "Você contribuiu com 1.240 refeições em 2025 em São Paulo").

O doador escolhe se quer aparecer no hall da fama público da landing page. Quem optar por aparecer tem nome ou logo exibido com o badge ou diploma correspondente. Quem preferir discrição recebe o reconhecimento de forma privada, sem exposição pública.

## Repositório do Projeto

git@github.com:Pedrocorgnati/prato-solidario.git

## Configuração do Pipeline

- Contexto comercial: sim
- Marketing: sim
- Design visual: sim
