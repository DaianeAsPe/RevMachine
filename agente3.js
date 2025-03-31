import { clonarAmbiente, imprimirMatriz } from './ambiente.js';
import { registrarAcao, adicionarPontuacao } from './gerencia.js';

const agente3 = {
    populacao: [],
    melhorIndividuo: null,
    historicoFitness: [],
    caminhoAtual: [],
    passoAtual: 0,
    intervaloAnimacao: null,
    animacaoPausada: false,
    evolucaoPorGeracao: [],

    // Parâmetros do algoritmo genético
    tamanhoPopulacao: 50,
    taxaMutacao: 0.05,
    numeroGeracoes: 30,
    tempoEsperaAnimacao: 100, // ms entre passos

    iniciarJogo: function(ambiente) {
        registrarAcao('Algoritmo Genético', 'Iniciando evolução...');
        this.executarAlgoritmoGenetico(ambiente);
    },

    // Inicializa a população com genomas totalmente aleatórios
    iniciarPopulacao: function() {
        this.populacao = [];
        for (let i = 0; i < this.tamanhoPopulacao; i++) {
            // Gera genomas de tamanhos variados (entre 50 e 200 passos)
            const tamanhoGenoma = 50 + Math.floor(Math.random() * 150);
            const genoma = this.gerarGenomaAleatorio(tamanhoGenoma);
            const individuo = { 
                genoma, 
                fitness: -Infinity, // Fitness inicial negativo
                genomaEfetivo: [] 
            };
            this.populacao.push(individuo);
        }
        this.melhorIndividuo = null; // Reseta o melhor indivíduo
    },

    // Gera um genoma completamente aleatório
    gerarGenomaAleatorio: function(tamanho) {
        const acoes = ['up', 'down', 'left', 'right', 'atirar'];
        return Array.from({ length: tamanho }, () => 
            acoes[Math.floor(Math.random() * acoes.length)]);
    },

    // Calcula a fitness de um indivíduo sem qualquer conhecimento prévio
    calcularFitness: function(individuo, ambiente) {
        let x = 0, y = 0;
        let pontuacao = 0;
        let passosForaMatriz = 0;
        let entradasEscombros = 0;
        let entrouNaMaquina = false;
        let ambienteCopia = clonarAmbiente(ambiente);
        let genomaEfetivo = [];
        let continuar = true;
        let passosDados = 0;
        let tiroUsado = false;
        let temPremio = false;

        while (continuar && passosDados < 1000) {
            const acao = individuo.genoma[passosDados];
            genomaEfetivo.push(acao);
            
            // Verifica se completou objetivos (voltou para 0,0 com o prêmio)
            if (x === 0 && y === 0 && temPremio) {
                pontuacao += 5000;
                continuar = false;
                break;
            }

            // Executa ação de forma completamente aleatória inicialmente
            switch (acao) {
                case 'up': x -= 1; break;
                case 'down': x += 1; break;
                case 'left': y -= 1; break;
                case 'right': y += 1; break;
                case 'atirar':
                    if (!tiroUsado) {
                        tiroUsado = true;
                        let acertou = false;
                        const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                        for (let [dx, dy] of direcoes) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < ambienteCopia.length && ny >= 0 && ny < ambienteCopia[0].length && 
                                ambienteCopia[nx][ny].includes('M')) {
                                pontuacao += 500;
                                ambienteCopia[nx][ny] = ambienteCopia[nx][ny].replace('M', '');
                                acertou = true;
                            }
                        }
                        if (!acertou) {
                            pontuacao -= 100;
                        }
                    } else {
                        pontuacao -= 500;
                    }
                    break;
            }

            // Verifica posição
            if (x < 0 || x >= ambienteCopia.length || y < 0 || y >= ambienteCopia[0].length) {
                passosForaMatriz++;
                pontuacao -= 10;
            } 
            else if (ambienteCopia[x] && ambienteCopia[x][y]) {
                if (ambienteCopia[x][y].includes('E')) {
                    entradasEscombros++;
                    pontuacao -= 50;
                }
                else if (ambienteCopia[x][y].includes('M')) {
                    pontuacao -= 1000;
                    entrouNaMaquina = true;
                    continuar = false;
                    break;
                }
                else if (ambienteCopia[x][y].includes('C')) {
                    pontuacao += 2000;
                    ambienteCopia[x][y] = ambienteCopia[x][y].replace('C', '');
                    temPremio = true;
                }
            }

            passosDados++;
        }

        // Calcula fitness final sem qualquer viés inicial
        individuo.fitness = pontuacao - (passosForaMatriz * 10) - (entradasEscombros * 50);
        if (entrouNaMaquina) {
            individuo.fitness -= 1000;
        }
        if (x === 0 && y === 0 && temPremio) {
            individuo.fitness += 5000;
        }
        individuo.genomaEfetivo = genomaEfetivo;
        return individuo.fitness;
    },

    // Cruza dois indivíduos sem qualquer lógica especial
    cruzar: function(individuo1, individuo2) {
        const pontoCorte = Math.floor(Math.random() * Math.min(
            individuo1.genoma.length, 
            individuo2.genoma.length
        ));
        return { 
            genoma: [
                ...individuo1.genoma.slice(0, pontoCorte), 
                ...individuo2.genoma.slice(pontoCorte)
            ], 
            fitness: -Infinity,
            genomaEfetivo: []
        };
    },

    // Aplica mutação completamente aleatória
    mutar: function(individuo) {
        const acoes = ['up', 'down', 'left', 'right', 'atirar'];
        for (let i = 0; i < individuo.genoma.length; i++) {
            if (Math.random() < this.taxaMutacao) {
                individuo.genoma[i] = acoes[Math.floor(Math.random() * acoes.length)];
            }
        }
    },

    // Seleção natural básica
    selecionarECruzar: function() {
        // Ordena por fitness (os melhores sobrevivem)
        this.populacao.sort((a, b) => b.fitness - a.fitness);
        
        // Atualiza o melhor indivíduo global
        if (this.populacao.length > 0 && (!this.melhorIndividuo || this.populacao[0].fitness > this.melhorIndividuo.fitness)) {
            this.melhorIndividuo = {...this.populacao[0]};
        }
        
        // Seleção por torneio simples
        const novaPopulacao = [];
        const metade = Math.floor(this.populacao.length / 2);
        
        for (let i = 0; i < metade; i++) {
            // Seleciona aleatoriamente dois indivíduos e pega o melhor
            const idx1 = Math.floor(Math.random() * metade);
            const idx2 = Math.floor(Math.random() * metade);
            const melhor = this.populacao[idx1].fitness > this.populacao[idx2].fitness ? 
                          this.populacao[idx1] : this.populacao[idx2];
            
            novaPopulacao.push(melhor);
            
            // Cruza com outro indivíduo aleatório
            const idx3 = Math.floor(Math.random() * metade);
            const filho = this.cruzar(melhor, this.populacao[idx3]);
            this.mutar(filho);
            novaPopulacao.push(filho);
        }
        
        this.populacao = novaPopulacao;
    },

    // Executa o algoritmo genético
    executarAlgoritmoGenetico: function(ambiente) {
        this.melhorIndividuo = null;
        this.historicoFitness = [];
        this.evolucaoPorGeracao = [];
        this.iniciarPopulacao();

        for (let geracao = 0; geracao < this.numeroGeracoes; geracao++) {
            // Avalia todos os indivíduos
            const fitnessDaGeracao = [];
            for (let individuo of this.populacao) {
                const fitness = this.calcularFitness(individuo, ambiente);
                fitnessDaGeracao.push(fitness);
            }
            this.evolucaoPorGeracao.push([...fitnessDaGeracao]);

            // Seleção e cruzamento
            this.selecionarECruzar();
            
            // Registra o fitness do melhor da geração
            this.populacao.sort((a, b) => b.fitness - a.fitness);
            this.historicoFitness.push(this.populacao[0].fitness);
            
            registrarAcao('Evolução', `Geração ${geracao + 1}: Melhor fitness = ${this.populacao[0].fitness}`);
        }

        this.melhorIndividuo = this.populacao[0];
        registrarAcao('Evolução', `Melhor fitness final: ${this.melhorIndividuo.fitness}`);
        this.exibirCaminhoMelhorAgente(ambiente);
        this.exibirEvolucaoPorGeracao();
        adicionarPontuacao(1, this.melhorIndividuo.fitness);
    },

    // Exibe o caminho do melhor agente
    exibirCaminhoMelhorAgente: function(ambiente) {
        const container = document.getElementById('agente-table-container');
        container.innerHTML = '';
        
        // Controles de animação (mantido igual)
        const controles = document.createElement('div');
        controles.className = 'animacao-controles';
        
        const btnIniciar = document.createElement('button');
        btnIniciar.textContent = '▶ Iniciar';
        btnIniciar.addEventListener('click', () => this.iniciarAnimacao(ambiente));
        
        const btnPausar = document.createElement('button');
        btnPausar.textContent = '⏸ Pausar';
        btnPausar.addEventListener('click', () => this.pausarAnimacao());
        
        const btnReiniciar = document.createElement('button');
        btnReiniciar.textContent = '↻ Reiniciar';
        btnReiniciar.addEventListener('click', () => this.reiniciarAnimacao(ambiente));
        
        controles.appendChild(btnIniciar);
        controles.appendChild(btnPausar);
        controles.appendChild(btnReiniciar);
        container.appendChild(controles);
    
        // Tabela de passos (mantido igual)
        const table = document.createElement('table');
        table.className = 'agente-table';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        ['Passo', 'Ação', 'Posição', 'Pontuação', 'Acumulado', 'Mensagem'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        container.appendChild(table);
        
        // Prepara os dados do caminho
        this.prepararDadosCaminho(ambiente);
        
        
        // Exibe a posição inicial do melhor agente
        const matrizInicial = clonarAmbiente(ambiente);
        console.log("Matriz inicial:", matrizInicial); // Verifique no console
        imprimirMatriz(matrizInicial, [{
            x: 0,
            y: 0,
            tipo: 'agente',
            classe: 'agente-inicial'
        }]);
        
        this.exibirResumoFinal(container);
        
        // Inicia a animação automaticamente
        this.iniciarAnimacao(ambiente);
    },

    // Prepara os dados do caminho percorrido
    prepararDadosCaminho: function(ambiente) {
        this.caminhoAtual = [];
        let x = 0, y = 0;
        let pontuacaoTotal = 0;
        let ambienteCopia = clonarAmbiente(ambiente);
        const genoma = this.melhorIndividuo.genomaEfetivo || this.melhorIndividuo.genoma;
        let tiroUsado = false;
        let temPremio = false;
        let missaoCompleta = false;

        for (let i = 0; i < genoma.length; i++) {
            const acao = genoma[i];
            const registro = {
                passo: i + 1,
                acao,
                x,
                y,
                pontuacaoPasso: 0,
                pontuacaoTotal: 0,
                mensagem: '',
                matriz: clonarAmbiente(ambienteCopia)
            };

            if (x === 0 && y === 0 && temPremio) {
                registro.pontuacaoPasso += 5000;
                registro.mensagem = "Missão completa! Voltou à base com o prêmio!";
                pontuacaoTotal += registro.pontuacaoPasso;
                registro.pontuacaoTotal = pontuacaoTotal;
                this.caminhoAtual.push(registro);
                missaoCompleta = true;
                break;
            }

            switch (acao) {
                case 'up': x -= 1; break;
                case 'down': x += 1; break;
                case 'left': y -= 1; break;
                case 'right': y += 1; break;
                case 'atirar':
                    registro.mensagem = "Atirou";
                    if (!tiroUsado) {
                        tiroUsado = true;
                        let acertou = false;
                        const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                        for (let [dx, dy] of direcoes) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < ambienteCopia.length && ny >= 0 && ny < ambienteCopia[0].length && 
                                ambienteCopia[nx][ny].includes('M')) {
                                registro.pontuacaoPasso += 500;
                                ambienteCopia[nx][ny] = ambienteCopia[nx][ny].replace('M', '');
                                acertou = true;
                            }
                        }
                        registro.mensagem += acertou ? " - Acertou máquina" : " - Errou";
                        if (!acertou) {
                            registro.pontuacaoPasso -= 1000;
                        }
                    } else {
                        registro.pontuacaoPasso -= 500;
                        registro.mensagem = "Tentou atirar novamente - Penalizado!";
                    }
                    break;
            }

            if (x < 0 || x >= ambienteCopia.length || y < 0 || y >= ambienteCopia[0].length) {
                registro.pontuacaoPasso -= 100;
                registro.mensagem = "Saiu da matriz";
            } 
            else if (ambienteCopia[x] && ambienteCopia[x][y]) {
                if (ambienteCopia[x][y].includes('E')) {
                    registro.pontuacaoPasso -= 100;
                    registro.mensagem = "Entrou em escombros";
                }
                else if (ambienteCopia[x][y].includes('M')) {
                    registro.pontuacaoPasso -= 5000;
                    registro.mensagem = "Foi destruído pela máquina!";
                    pontuacaoTotal += registro.pontuacaoPasso;
                    registro.pontuacaoTotal = pontuacaoTotal;
                    this.caminhoAtual.push(registro);
                    break;
                }
                else if (ambienteCopia[x][y].includes('C')) {
                    registro.pontuacaoPasso += 2000;
                    ambienteCopia[x][y] = ambienteCopia[x][y].replace('C', '');
                    registro.mensagem = "Pegou o prêmio!";
                    temPremio = true;
                }
            }

            pontuacaoTotal += registro.pontuacaoPasso;
            registro.pontuacaoTotal = pontuacaoTotal;
            this.caminhoAtual.push(registro);

            if (missaoCompleta) break;
        }
    },

    // Exibe a evolução por geração
    exibirEvolucaoPorGeracao: function() {
        const container = document.getElementById('evolucao-container');
        if (!container) return;
        
        container.innerHTML = '<h3>Evolução por Geração</h3>';
        
        const table = document.createElement('table');
        table.className = 'evolucao-table';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        ['Geração', 'Melhor Fitness', 'Média Fitness', 'Pior Fitness'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        this.evolucaoPorGeracao.forEach((fitnessDaGeracao, indice) => {
            const melhor = Math.max(...fitnessDaGeracao);
            const pior = Math.min(...fitnessDaGeracao);
            const media = (fitnessDaGeracao.reduce((a, b) => a + b, 0) / fitnessDaGeracao.length).toFixed(2);
            
            const row = document.createElement('tr');
            
            [indice + 1, melhor, media, pior].forEach(valor => {
                const td = document.createElement('td');
                td.textContent = valor;
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
    },

    // Exibe o resumo final do desempenho
    exibirResumoFinal: function(container) {
        const resumo = document.createElement('div');
        resumo.className = 'resumo-final';
        
        const premioColetado = this.caminhoAtual.some(p => p.mensagem.includes('prêmio'));
        const maquinaEliminada = this.caminhoAtual.some(p => p.mensagem.includes('Acertou'));
        const destruidoPorMaquina = this.caminhoAtual.some(p => p.mensagem.includes('destruído'));
        const saiuDaMatriz = this.caminhoAtual.some(p => p.mensagem.includes('Saiu da matriz'));
        const missaoCompleta = this.caminhoAtual.some(p => p.mensagem.includes('Missão completa'));
        
        resumo.innerHTML = `
            <h4>Resumo Final</h4>
            <p><strong>Fitness total:</strong> ${this.melhorIndividuo.fitness}</p>
            <p><strong>Total de passos:</strong> ${this.caminhoAtual.length}</p>
            <p><strong>Missão completa:</strong> ${missaoCompleta ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Prêmio coletado:</strong> ${premioColetado ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Máquina eliminada:</strong> ${maquinaEliminada ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Destruído por máquina:</strong> ${destruidoPorMaquina ? '❌ Sim' : '✅ Não'}</p>
            <p><strong>Saiu da matriz:</strong> ${saiuDaMatriz ? '❌ Sim' : '✅ Não'}</p>
        `;
        
        container.appendChild(resumo);
    },

    // Inicia a animação do caminho
    iniciarAnimacao: function(ambiente) {
        if (this.intervaloAnimacao) {
            clearInterval(this.intervaloAnimacao);
        }
    
        const tbody = document.querySelector('#agente-table-container table tbody');
        tbody.innerHTML = '';
        this.passoAtual = 0;
        this.animacaoPausada = false;
    
        this.intervaloAnimacao = setInterval(() => {
            if (this.passoAtual >= this.caminhoAtual.length || this.animacaoPausada) {
                if (this.passoAtual >= this.caminhoAtual.length) {
                    clearInterval(this.intervaloAnimacao);
                }
                return;
            }
    
            const registro = this.caminhoAtual[this.passoAtual];
            
            // Atualiza a tabela (mantido igual)
            const row = document.createElement('tr');
            ['passo', 'acao', 'posicao', 'pontuacaoPasso', 'pontuacaoTotal', 'mensagem'].forEach(key => {
                const cell = document.createElement('td');
                if (key === 'posicao') {
                    cell.textContent = `(${registro.x},${registro.y})`;
                } else {
                    cell.textContent = registro[key];
                }
                row.appendChild(cell);
            });
            tbody.appendChild(row);

            console.log("Dados enviados para imprimirMatriz:", {
                matriz: registro.matriz,
                posicoesEspeciais: [{
                    x: registro.x,
                    y: registro.y,
                    tipo: 'agente',
                    classe: 'agente-ativo'
                }]
            });
            
            // Atualiza a posição do agente na matriz
            imprimirMatriz(registro.matriz, [{
                x: registro.x,
                y: registro.y,
                tipo: 'agente',
                classe: 'agente-ativo'
            }]);
            
            this.passoAtual++;
        }, this.tempoEsperaAnimacao);
    },


    // Pausa a animação
    pausarAnimacao: function() {
        this.animacaoPausada = true;
    },

    // Reinicia a animação
    reiniciarAnimacao: function(ambiente) {
        this.pausarAnimacao();
        this.iniciarAnimacao(ambiente);
    },

    // Para o jogo completamente
    pararJogo: function() {
        if (this.intervaloAnimacao) {
            clearInterval(this.intervaloAnimacao);
            this.intervaloAnimacao = null;
        }
        this.animacaoPausada = false;
    }
};

export default agente3;