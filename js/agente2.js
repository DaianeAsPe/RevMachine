// O problema atual é que ele tá voltando para base passando por casas que sabe que tem escombros (ainda tentando resolver)
// ============================================================================

// Importando dos outros arquivos js
import { registrarAcao, adicionarPontuacao } from '../js/gerencia.js';
import { imprimirMatriz } from '../js/ambiente.js';

// Estado inicial do jogo
export default {
    iniciarJogo: function(ambiente) {
        this.ambiente = ambiente;
        this.n = ambiente.length;
        this.x = 0;
        this.y = 0;
        this.pontuacao = 0;
        this.memoria = Array(this.n).fill().map(() => Array(this.n).fill('?'));
        this.temTiro = true;
        this.monstroMorto = false;
        this.temPremio = false;
        this.pausado = false;
        this.parar = false;
        this.execucao = 1;
        this.casasSeguras = new Set(['0,0']);
        this.casasSuspeitas = new Set();
        this.casasComEscombros = new Set();
        this.casasVisitadas = new Set(['0,0']);
        this.posicaoMonstroConhecida = null;
        this.morreuParaMonstro = false;
        
        this.atualizarMemoria(0, 0);
        
        imprimirMatriz(this.ambiente, [{
            x: this.x,
            y: this.y,
            tipo: 'agente',
            classe: 'agente-ativo'
        }]);
        
        this.jogar();
    },

    // O agente 2 tem memória para reiniciar com a memória
    reiniciarPosicao: function() {
        this.x = 0;
        this.y = 0;
        this.temTiro = true;
        this.pausado = false;
        this.parar = false;
        this.morreuParaMonstro = false;
        
        registrarAcao('REINICIANDO', 'Voltando à base (0,0) com memória intacta', 'sistema');
        
        this.atualizarVisualizacaoAgente(0, 0);
        
        if (this.posicaoMonstroConhecida) {
            setTimeout(() => this.irAteMonstro(), 1000);
        } else {
            setTimeout(() => this.jogar(), 1000);
        }
    },

    atualizarVisualizacaoAgente: function(x, y) {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('agente-ativo');
            const img = cell.querySelector('img[alt="Agente"]');
            if (img) cell.removeChild(img);
        });
        
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('agente-ativo');
            const img = document.createElement('img');
            img.src = '../images/hacker.png';
            img.alt = 'Agente';
            img.className = 'img-agente';
            img.style.zIndex = '10';
            cell.appendChild(img);
        }
        
        imprimirMatriz(this.ambiente, [{
            x: x,
            y: y,
            tipo: 'agente',
            classe: 'agente-ativo'
        }]);
    },

    jogar: function() {
        if (this.parar) return; // Para a execução

        if (this.pausado) {
            setTimeout(() => this.jogar(), 100); // Velocidade do agente no ambiente
            return;
        }

        if (this.temPremio && this.x === 0 && this.y === 0) { // Verifica se está na casa inicial com o prêmio
            this.finalizarJogo();
            return;
        }

        if (this.temPremio) { // Verifica se tem o prêmio e direciona a voltar para a casa inicial
            this.voltarParaBase();
            return;
        }

        if (this.morreuParaMonstro && this.posicaoMonstroConhecida) { // Verifica se morreu para o monstro e guarda na memória a posição do monstro
            this.irAteMonstro();
            return;
        }

        if (this.temTiro && this.memoria[this.x][this.y].includes('R') && !this.monstroMorto) { // Verifica  se o monstro ainda está vivo, busca na memória a posição das casas adjacentes com ruído e se há bala para tentar ir matar o monstro
            this.tentarMatarMonstro();
            return;
        }

        this.moverInteligentemente();
    },

    finalizarJogo: function() {
        this.pontuacao += 5000;
        registrarAcao('Missão completa', `Pontuação: ${this.pontuacao}`, 'agente');
        adicionarPontuacao(this.execucao, this.pontuacao);
    },
    
    moverInteligentemente: function() {
        // Lista todas as direções possíveis
        const direcoes = [
            { dir: 'up', dx: -1, dy: 0 },
            { dir: 'down', dx: 1, dy: 0 },
            { dir: 'left', dx: 0, dy: -1 },
            { dir: 'right', dx: 0, dy: 1 }
        ].filter(d => 
            this.x + d.dx >= 0 && this.x + d.dx < this.n && 
            this.y + d.dy >= 0 && this.y + d.dy < this.n
        );

        // Classifica as direções com base na estratégia de priorização
        const direcoesClassificadas = direcoes.map(d => {
            const nx = this.x + d.dx;
            const ny = this.y + d.dy;
            const key = `${nx},${ny}`;
            const cell = this.memoria[nx][ny];
            
            let prioridade;
            if (cell.includes('M')) {
                prioridade = 999; // Máxima prioridade para evitar
            } else if (!this.casasVisitadas.has(key)) {
                prioridade = cell.includes('E') ? 1 : 0; // Prioriza casas não visitadas
            } else {
                prioridade = cell.includes('E') ? 3 : 2; // Casas visitadas têm menor prioridade
            }
            
            return {
                direcao: d.dir,
                nx, ny,
                key,
                prioridade,
                temE: cell.includes('E'),
                visitada: this.casasVisitadas.has(key)
            };
        }).filter(d => d.prioridade < 999); // Remove direções com monstros

        // Se não houver direções válidas, fica parado
        if (direcoesClassificadas.length === 0) {
            registrarAcao('SEM SAÍDA', 'Nenhuma direção segura disponível', 'agente');
            return;
        }

        // Ordena por prioridade (menor primeiro)
        direcoesClassificadas.sort((a, b) => a.prioridade - b.prioridade);

        // Pega todas as direções com a melhor prioridade
        const melhorPrioridade = direcoesClassificadas[0].prioridade;
        const melhoresOpcoes = direcoesClassificadas.filter(d => d.prioridade === melhorPrioridade);

        // Escolhe aleatoriamente entre as melhores opções
        const escolha = melhoresOpcoes[Math.floor(Math.random() * melhoresOpcoes.length)];

        // Move para a posição escolhida
        this.x = escolha.nx;
        this.y = escolha.ny;
        this.casasVisitadas.add(escolha.key);
        this.atualizarMemoria(this.x, this.y);
        this.atualizarVisualizacaoAgente(this.x, this.y);

        registrarAcao('Movimento', `Para (${this.x},${this.y}) - ${escolha.visitada ? 'Visitada' : 'Nova'}`, 'agente');
        setTimeout(() => this.jogar(), 500);
    },
    
    // Função para tentar matar o monstro é feita com tiro aleatório
    tentarMatarMonstro: function() {
        if (!this.temTiro) { // Se não tem tiro apenas continua explorando sem poder atirar
            registrarAcao('SEM TIRO', 'Continuando exploração', 'agente');
            this.moverInteligentemente();
            return;
        }

        this.temTiro = false;
        const acertou = Math.random() < 0.7; // Probabilidade de 70% de acertar

        const direcoes = [[-1,0],[1,0],[0,-1],[0,1]];
        let monstroEncontrado = false;
        
        for (const [dx, dy] of direcoes) {
            const nx = this.x + dx;
            const ny = this.y + dy;
            
            if (nx >= 0 && nx < this.n && ny >= 0 && ny < this.n && 
                this.ambiente[nx][ny].includes('M')) {
                
                monstroEncontrado = true;
                
                if (acertou) { // Verificação se acertou o tiro
                    this.ambiente[nx][ny] = this.ambiente[nx][ny].replace('M', '');
                    this.memoria[nx][ny] = this.memoria[nx][ny].replace('M', '');
                    this.monstroMorto = true;
                    registrarAcao('TIRO CERTO', `Monstro morto em (${nx},${ny})! +1000 pontos`, 'agente');
                    this.pontuacao += 1000;
                    
                    direcoes.forEach(([ddx, ddy]) => {
                        const ax = nx + ddx;
                        const ay = ny + ddy;
                        if (ax >= 0 && ax < this.n && ay >= 0 && ay < this.n) {
                            this.ambiente[ax][ay] = this.ambiente[ax][ay].replace('R', '');
                            this.memoria[ax][ay] = this.memoria[ax][ay].replace('R', '');
                        }
                    });
                } else {
                    registrarAcao('TIRO ERRADO', `Falhou ao matar monstro em (${nx},${ny}) -500 pontos`, 'agente');
                    this.pontuacao -= 500;
                }
                break;
            }
        }

        if (!monstroEncontrado) {// Verifica se errou o tiro
            registrarAcao('TIRO NO ESCURO', 'Atirou mas não havia monstro adjacente -300 pontos', 'agente');
            this.pontuacao -= 100;
        }

        setTimeout(() => this.jogar(), 500); // Velocidade do jogo
    },
    
    // Busca na memória a posição do monstro
    irAteMonstro: function() {
        const dx = Math.abs(this.x - this.posicaoMonstroConhecida.x);
        const dy = Math.abs(this.y - this.posicaoMonstroConhecida.y);

        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            this.tentarMatarMonstro();
            return;
        }

        const direcoes = [];
        if (this.x < this.posicaoMonstroConhecida.x) direcoes.push('down');
        if (this.x > this.posicaoMonstroConhecida.x) direcoes.push('up');
        if (this.y < this.posicaoMonstroConhecida.y) direcoes.push('right');
        if (this.y > this.posicaoMonstroConhecida.y) direcoes.push('left');

        const direcaoEscolhida = direcoes[Math.floor(Math.random() * direcoes.length)];

        let novoX = this.x, novoY = this.y;
        switch (direcaoEscolhida) {
            case 'up': novoX--; break;
            case 'down': novoX++; break;
            case 'left': novoY--; break;
            case 'right': novoY++; break;
        }

        if (this.memoria[novoX][novoY].includes('E') || 
            (this.memoria[novoX][novoY].includes('M') && !(novoX === this.posicaoMonstroConhecida.x && novoY === this.posicaoMonstroConhecida.y))) {
            this.moverInteligentemente();
            return;
        }

        this.x = novoX;
        this.y = novoY;
        this.casasVisitadas.add(`${novoX},${novoY}`);
        this.atualizarMemoria(novoX, novoY);
        this.atualizarVisualizacaoAgente(novoX, novoY);

        registrarAcao('CAÇANDO MONSTRO', `Indo para (${novoX},${novoY})`, 'agente');
        setTimeout(() => this.jogar(), 500);
    },

    atualizarMemoria: function(x, y) {
        // Primeiro verifica se morreu
        if (this.ambiente[x][y].includes('M')) {
            this.pontuacao -= 2000;
            registrarAcao('AGENTE MORTO', `Monstro em (${x},${y})! -2000 pontos`, 'agente');
            adicionarPontuacao(this.execucao, this.pontuacao);
            this.morreuParaMonstro = true;
            this.posicaoMonstroConhecida = { x, y };
            
            // Adiciona delay antes de reiniciar
            setTimeout(() => this.reiniciarPosicao(), 500);
            return;
        }

        this.memoria[x][y] = this.ambiente[x][y];
        const key = `${x},${y}`;

        if (this.ambiente[x][y].includes('C') && !this.temPremio) {
            this.temPremio = true;
            this.ambiente[x][y] = this.ambiente[x][y].replace('C', '');
            registrarAcao('PRÊMIO COLETADO', `Na posição (${x},${y})`, 'agente');
        }

        if (this.ambiente[x][y].includes('E')) {
            this.casasComEscombros.add(key);
            this.pontuacao -= 10;
            registrarAcao('ESCOMBROS', `Perdeu 10 pontos (${x},${y})`, 'agente');
        }

        if (!this.ambiente[x][y].includes('M') && !this.ambiente[x][y].includes('E')) {
            this.casasSeguras.add(key);
        }

        if (this.ambiente[x][y].includes('R') && !this.monstroMorto) {
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx, dy]) => {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.n && ny >= 0 && ny < this.n) {
                    this.casasSuspeitas.add(`${nx},${ny}`);
                }
            });
        }
    },

    // Função para voltar para a base com o prêmio
    voltarParaBase: function() {
        if (this.x === 0 && this.y === 0) {
            registrarAcao('BASE', 'Missão completa! +5000 pontos', 'agente');
            this.pontuacao += 5000;
            adicionarPontuacao(this.execucao, this.pontuacao);
            return;
        }

        const direcoesPossiveis = [];
        if (this.x > 0) direcoesPossiveis.push('up');
        if (this.y > 0) direcoesPossiveis.push('left');

        if (direcoesPossiveis.length === 0) {
            if (this.x < this.n - 1) direcoesPossiveis.push('down');
            if (this.y < this.n - 1) direcoesPossiveis.push('right');
        }

        const direcoesClassificadas = direcoesPossiveis.map(dir => {
            let nx = this.x, ny = this.y;
            switch (dir) {
                case 'up': nx--; break;
                case 'down': nx++; break;
                case 'left': ny--; break;
                case 'right': ny++; break;
            }

            return {
                direcao: dir,
                nx, ny,
                key: `${nx},${ny}`,
                distancia: nx + ny,
                temE: this.memoria[nx][ny].includes('E'),
                temM: this.memoria[nx][ny].includes('M'),
                visitada: this.casasVisitadas.has(`${nx},${ny}`)
            };
        }).filter(d => !d.temM)
        .sort((a, b) => {
            if (a.distancia !== b.distancia) return a.distancia - b.distancia;
            if (a.visitada !== b.visitada) return a.visitada ? -1 : 1;
            return a.temE ? 1 : -1;
        });

        if (direcoesClassificadas.length === 0) {
            registrarAcao('SEM CAMINHO', `Pontuação: ${this.pontuacao}`, 'agente');
            this.parar = true;
            return;
        }

        const melhorDirecao = direcoesClassificadas[0];
        this.x = melhorDirecao.nx;
        this.y = melhorDirecao.ny;
        this.casasVisitadas.add(melhorDirecao.key);
        this.atualizarVisualizacaoAgente(this.x, this.y);

        registrarAcao('VOLTANDO', `Para (${this.x},${this.y})`, 'agente');
        setTimeout(() => this.jogar(), 500);
    },

    //==================================================
    // Funções de controle do jogo
    //==================================================

    pausarJogo: function() {
        this.pausado = true;
        registrarAcao('JOGO PAUSADO', '', 'sistema');
    },

    retomarJogo: function() {
        this.pausado = false;
        registrarAcao('JOGO RETOMADO', '', 'sistema');
        this.jogar();
    },

    pararJogo: function() {
        this.parar = true;
        registrarAcao('JOGO PARADO', `Pontuação: ${this.pontuacao}`, 'sistema');
        adicionarPontuacao(this.execucao, this.pontuacao);
    }
};