<h1>RevMachine Game</h1>

<h3>História</h3>

Uma empresa trabalha há muitos anos com a criação de robôs usando a inteligência artificial, com o passar dos tempos, essas criaturas começaram a ter autoconsciência da própria existência, inconformados a continuar vivendo trancafiados em um prédio, reúnem-se para um plano simples: fugir. 

Como resultado disso, uma rebelião dentro da empresa, os funcionários até tentaram controlar, mas essas máquinas estavam determinadas a explorarem o mundo, derrubando tudo e todos que encontravam pela frente. 

A empresa tem uma sala de controle geral, onde há um código secreto de desativação completa que ao ser acessado pode acabar com todo esse caos. O problema é que os robôs também sabem disso, portanto, estão guardando o caminho que leva à sala do terminal. Como guarda, colocaram sua máquina potente e furiosa para proteger o acesso, então, quem pode encarar? 

Sem saída, a equipe de liderança lançou a proposta: $30.000.000,00 de dólares para a pessoa que corajosamente ousasse completar o desafio: entrar no prédio, procurar a sala do terminal, pegar o código e sair com vida. O prédio está destruído, algumas salas interditadas por conta dos escombros resultados de desabamentos causados pelas máquinas, mas o problema maior chama-se TexMachine, o robõ cão de guarda que está no prédio, pronto para matar. 

Para a surpresa da empresa, muitos candidataram-se, muitos jovens programadores entre eles, de olho na premiação milionária, ignorando todos os perigos à espreita, resolveram arriscar as próprias vidas em prol da causa. 

O TexMachine emite um sinal de ruído quando está bem próximo, o agente salvador conta com um notebook que capta esse sinal quando está em alta intensidade, com isso, ele pode acessar o código fonte da máquina assassina e matá-la, mas se ele errar, estará dentro do prédio sem mais nenhuma chance de proteção. O sinal só poderá ser captado uma única vez e precisa ser bem aproveitado, será que nossos voluntários estão prontos para a missão? É o que queremos descobrir. 

<h2>Tela de Jogo:</h2>

![Tela inicial](https://github.com/DaianeAsPe/RevMachine/blob/main/ImageTelaJogo/tela1.png?raw=true)


Construção 

A construção toda foi feita com as linguagens HTML, CSS e Javascript. 

Ambiente: O ambiente se passa em uma matriz escolhida no início do jogo, variando entre 4x4 até 20x20, simulando as salas do prédio. 

Existe uma máquina assassina em uma das células da matriz, chamada TexMachine, nas casas adjacentes a ela há a percepção do ruído sonoro emitido para mostrar ao agente que a fera está próxima; 

O prêmio fica em uma das casas da matriz acompanhado de um sinal de rede, que fica nessa mesma casa, é emitido para sinalizar que o agente encontrou o código secreto; 

Foram destinadas que 20% das células da matriz seriam ocupadas por escombros, ou seja, as salas estão interditadas para o agente e, nas casas adjacentes a esses desabamentos, há a percepção de poeira como indício de proximidade. 

O agente sempre começa a jogada na casa de coordenadas 0,0 (canto superior direito). 

 

<h3>Agente da Versão 1:</h3> Essa versão do agente é totalmente aleatória, ou seja, todos os passos e decisões são baseados na aleatoriedade, tudo que é definido é que ele sai da casa inicial e anda pelo tabuleiro, ganhando ou perdendo pontos a depender da situação, e pode matar a máquina, mas a direção escolhida para efetuar a tentativa é aleatória também. É considerada missão concluída se pegar o código secreto e voltar para a casa 0,0 sem ser morto pelo monstro. 

Pontuação - A pontuação máxima é de 2950, considerando que: 

Perde 10 pontos por escombro; 

Ganha 2000 pontos por pegar o prêmio; 

Ganha 1000 pontos por matar a máquina; 

Perde 2000 pontos ao ser morto. 

 

<h3>Agente da Versão 2 (Reativo):</h3>  O agente começa na casa 0,0 e não pode sair da matriz. Começa a andar aleatoriamente inicialmente, depois vai armazenando na memória quais as casas "seguras", armazena onde estão as percepções para identificar quais as casas “suspeitas”. Sabendo que a máquina assassina está sempre rodeada da percepção de ruído nas casas adjacentes; os escombros estão rodeados da percepção de poeira; o prêmio está acompanhado da percepção de brilho. 

Regras de prioridade: 

1 - Pegar o prêmio e retornar para a casa 0,0 pelo mesmo caminho, mesmo com as penalidades se houver escombros; 

2 – Enquanto não tem o prêmio e está explorando, precisa evitar as casas que já sabe que há escombros; 

3 - Matar o monstro, ao sentir a percepção do ruído, o agente terá a opção de atirar em uma direção em que acredita está o monstro; 

4 – Se morrer para o monstro a regra de prioridade se inverte para: 

A) Voltar para a casa onde sentiu o ruído e atirar no monstro, pois agora sabe em qual casa ele está; 

B) Se a casa de onde efetuou o disparo também tiver escombros, há uma exceção que o permite entrar nessa casa novamente. 

C) Ao matar o monstro, continua explorando até pegar o prêmio e voltar para a casa inicial. 

 

Regras das penalidades: 

- Perde 10 pontos toda vez que entrar em casa com escombros; 

- Perde 2000 pontos se entrar na casa do monstro; 

- Ganha 5000 ao pegar o prêmio e voltar para a casa 0,0; 

- Perde 100 pontos se errar o tiro; 

  

Regras extras: 

- Armazena o ambiente na memória: quando morre pelo monstro, reinicia da casa 0,0 com a memória atualizada daquele ambiente, ou seja, ele reinicia da casa 0,0 e sabe os lugares que já passou e o que tem nas células. 

- Só tem um único tiro disponível, se errar, continuará andando no ambiente sem poder se defender mais. 

 

<h3>Agente da Versão 3 (Algoritmo Genético):</h3> A versão mais complexa do agente, aplicando um algoritmo genético para treinar uma agente no jogo Revolta das Máquinas. O objetivo do agente é encontrar a melhor estratégia para percorrer a matriz do jogo, evitando penalidades e maximizando a pontuação. 

Criação da População: 

O algoritmo começa gerando 50 indivíduos (possíveis soluções), que são sequências de ações que o agente pode tomar no jogo; 

Avaliação da População: 

Cada indivíduo é testado no ambiente do jogo; 

O agente percorre a matriz, e sua pontuação é calculada com base no desempenho (se evitou penalidades, se alcançou o prêmio, se eliminou a máquina assassina, etc.). 

Premiações: 

+ 5000 pontos por retornar à base (0,0) com o prêmio. 

+ 2000 pontos por pegar o prêmio no ambiente (representado como 'C'). 

+ 500 pontos por acertar a máquina com o tiro. 

+ Acerto na máquina ao atirar e destruí-la, ganhando bônus de pontos. 

Punições: 

- 10 pontos por sair da matriz. 

- 50 pontos por entrar em escombros (representados por 'E'). 

- 1000 pontos por entrar na casa da máquina (representada por 'M'). 

- 500 pontos por tentar atirar novamente quando já atirou. 

- 100 pontos por sair da matriz ou fazer movimento inválido. 

- 1000 pontos por não acertar a máquina ao atirar. 

 

<i>Seleção:</i>

A seleção feita no código é baseada na ordenação da população pela pontuação e na eliminação dos piores indivíduos. 

Cada indivíduo (sequência de ações) recebe uma pontuação de acordo com seu desempenho no jogo; 

A lista de indivíduos é ordenada da maior para a menor pontuação; 

Apenas os 25 melhores indivíduos são mantidos; 

Os outros 25 são descartados; 

Os 25 melhores são usados para gerar novos indivíduos por meio de cruzamento e mutação: 

Dois indivíduos são escolhidos aleatoriamente entre os 25 melhores; 

O indivíduo com o melhor fitness entre os dois é escolhido; 

Esse indivíduo escolhido é cruzado com outro indivíduo aleatório dos 25 melhores; 

O filho sofre mutação e entra na nova população. 

Isso mantém a qualidade da população e evita que soluções ruins continuem: 

Baseada em desempenho: Apenas os indivíduos com melhores estratégias sobrevivem; 

Preserva a diversidade: Como a mutação é aplicada, sempre há novas variações; 

Evita estagnação: Descartar os piores impede que estratégias ruins continuem sendo passadas adiante. 

 

<i>Cruzamento:</i>

A população é ordenada do melhor para o pior, baseada na pontuação da função de avaliação; 

Isso garante que os indivíduos mais bem adaptados sejam os primeiros na lista; 

Apenas os 25 melhores indivíduos da população sobrevivem; 

Esses indivíduos serão usados para gerar a próxima geração; 

Para criar os 25 novos indivíduos, o código pega dois pais da lista dos melhores e os combina: feito por meio de uma abordagem simples de corte único. Isso significa que um ponto aleatório de corte é escolhido entre os dois genomas (sequências de ações) de dois indivíduos e o genoma resultante do filho é formado pela combinação dos segmentos de cada genoma, antes e depois do ponto de corte. 

Então ocorre: 

Seleção do ponto de corte: A variável pontoCorte é gerada aleatoriamente, sendo um número entre 0 e o tamanho mínimo dos dois genomas dos indivíduos, exceto o último genoma deles. 

Corte e combinação: O genoma do novo indivíduo (filho) é formado pela união dos segmentos dos genomas dos dois pais. A primeira parte vem de individuo1 e a segunda parte de individuo2, começando a partir do ponto de corte. 

Exemplo: Se os genomas dos dois indivíduos forem: 

individuo1.genoma “pai” = ['up', 'down', 'left', 'atirar'] 

individuo2.genoma “mãe” = ['right', 'up', 'down', 'atirar'] 

E se o ponto de corte aleatório for, por exemplo, o índice 2, o novo genoma seria: 

resultado.genoma “filho” = ['up', 'down', 'down', 'atirar']. 

O que acontece é que: 

Seleciona um ponto de corte no genoma do pai. 

Pega a parte do genoma do pai até o ponto de corte e a parte do genoma da mãe a partir do ponto de corte até o final. 

Combina essas partes para formar o novo genoma do filho. 

Em outras palavras, a primeira parte do genoma do filho vem do pai até o ponto de corte e a segunda parte vem da mãe depois do ponto de corte. 

Por exemplo, se o pai tem o genoma [A, B, C, D, E] e a mãe tem o genoma [1, 2, 3, 4], e o ponto de corte do pai for em 3, o genoma do filho seria: 

Filho: [A, B, C, 4]. 

Gera: 

Os primeiros 3 elementos vêm do pai. 

O último 1 elemento vem da mãe. 

<i>Mutação:</i> Ocorre em cada geração para introduzir variação na população e evitar que todos os indivíduos convirjam para uma solução subótima. quantos indivíduos sofrerão mutação, podemos calcular isso da seguinte forma: 

Após a reprodução, você tem um conjunto de novos indivíduos (filhos) gerados por cruzamento dos pais selecionados. 

Para cada filho, há uma chance de 5% de sofrer mutação. Isso significa que, em média, 5% dos filhos terão alguma alteração aleatória no seu código genético. 

Se um filho for selecionado para mutação, então um ou mais genes do seu cromossomo (dependendo da implementação) são alterados aleatoriamente. 

 

<i>Funcionamento:</i> 

Probabilidade de mutação: Define a taxa de mutação como 5% (mutation_rate = 0.05). Isso significa que, a cada iteração do loop que percorre a população nova de filhos gerados, existe uma chance de 5% de que um gene (ou ação) do indivíduo sofra mutação; 

 

Escolha do gene a ser mutado: Para cada indivíduo, se ele for selecionado para sofrer mutação (com base na probabilidade de mutação), o código escolhe um gene (uma ação no genoma) de forma aleatória para modificar. O genoma é representado por uma lista de ações (digamos, uma lista de números ou valores que correspondem às ações que o agente pode realizar no jogo); 

 

Como a mutação é aplicada: Muda o valor de um gene de forma aleatória, dependendo da estrutura do seu genoma. Por exemplo, se o genoma representa ações numéricas, a mutação poderia mudar o valor de um número para um valor aleatório dentro de um intervalo pré-determinado (digamos, entre um valor mínimo e máximo). Para isso, há o random.random() que gera um número entre 0 e 1. Se esse número for menor que a taxa de mutação (0.05), a mutação acontece. O índice do gene a ser alterado é escolhido aleatoriamente, e o valor desse gene é substituído por outro valor aleatório (no exemplo, uma ação que o agente pode tomar); 

 

Resultado da mutação: Após a mutação, o genoma do indivíduo é alterado, e esse novo genoma será considerado na próxima geração do algoritmo genético. Isso ajuda a manter a diversidade na população e permite que o algoritmo explore diferentes possibilidades de soluções. 

 

O processo é repetido a cada geração, onde o melhor indivíduo representa uma estratégia eficiente para navegar pelo jogo. 

O melhor indivíduo da última geração não é garantido ser o melhor de todas as gerações anteriores. Embora a seleção natural favoreça os indivíduos mais aptos ao longo das gerações, o melhor indivíduo de uma geração específica pode não ser o melhor de todas as gerações anteriores. 

Algumas razões para isso: 

Seleção: O processo de seleção mantém os melhores indivíduos de cada geração, mas isso não garante que o melhor de uma geração seja o melhor globalmente. Por exemplo, em uma geração pode haver uma solução que, devido a uma mutação ou cruzamento, atinja uma pontuação temporariamente boa, mas o processo de evolução pode resultar em uma solução ainda melhor mais adiante. Em outras palavras, a busca por soluções pode evoluir ao longo das gerações, não sendo sempre o melhor de uma geração a solução final. 

Mutação e Cruzamento: Durante o processo de mutação e cruzamento, as características dos indivíduos podem ser alteradas de forma imprevisível. Mesmo que o melhor indivíduo de uma geração seja muito bom, ele pode ser "superado" por um descendente que sofre uma mutação que resulta em uma solução melhor. A aleatoriedade dos processos de mutação e cruzamento pode fazer com que o melhor indivíduo de uma geração seja superado por um indivíduo da geração seguinte. 

Variedade de soluções: Dependendo do problema e da maneira como o algoritmo é projetado, pode haver múltiplas boas soluções para o problema. O melhor indivíduo de uma geração pode não ser a única solução ótima ou até mesmo a melhor em termos de longevidade ou adaptação ao longo de várias gerações. 

Se quisesse garantir que o melhor indivíduo sempre seja preservado ao longo das gerações, poderia ser implementado um elitismo no algoritmo, onde o melhor indivíduo de cada geração é automaticamente transferido para a próxima geração, sem sofrer alterações. Isso garante que o melhor indivíduo encontrado até o momento seja perdido. 

Como está sendo feito uma seleção de maneira adequada (como por exemplo, selecionando os melhores indivíduos para a próxima geração) e mantendo a diversidade da população, o melhor indivíduo da última geração pode, sim, ser o melhor globalmente, mas não há garantia de que isso sempre ocorra sem uma estratégia de elitismo. 
