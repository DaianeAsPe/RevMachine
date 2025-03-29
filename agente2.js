import { registrarAcao, adicionarPontuacao } from './gerencia.js';
import { imprimirMatriz } from './ambiente.js';

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
        this.casasComEscombros = new Set();
        this.casasVisitadas = new Set(['0,0']);
        
        this.atualizarMemoria(0, 0);
        
        // Renderização inicial corrigida
        imprimirMatriz(this.ambiente, [{
            x: this.x,
            y: this.y,
            tipo: 'agente',
            classe: 'agente-ativo'
        }]);
        
        this.jogar();
    },

    atualizarVisualizacaoAgente: function(x, y) {
        // Remove todas as classes de agente primeiro
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('agente-ativo');
            const img = cell.querySelector('img[alt="Agente"]');
            if (img) cell.removeChild(img);
        });
        
        // Adiciona o agente na nova posição
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('agente-ativo');
            const img = document.createElement('img');
            img.src = 'hacker.png';
            img.alt = 'Agente';
            img.className = 'img-agente';
            img.style.zIndex = '10';
            cell.appendChild(img);
        }
        
        // Atualiza a matriz com o novo estado
        imprimirMatriz(this.ambiente, [{
            x: x,
            y: y,
            tipo: 'agente',
            classe: 'agente-ativo'
        }]);
    },

    jogar: function() {
        if (this.parar) return;
        
        if (this.pausado) {
            setTimeout(() => this.jogar(), 100);
            return;
        }
        
        if (this.temPremio && this.x === 0 && this.y === 0) {
            this.pontuacao += 5000;
            registrarAcao('Missão completa', `Pontuação: ${this.pontuacao}`, 'agente');
            adicionarPontuacao(this.execucao, this.pontuacao);
            return;
        }
        
        if (this.temPremio) {
            this.voltarParaBase();
            return;
        }
        
        if (this.temTiro && this.memoria[this.x][this.y].includes('R') && !this.monstroMorto) {
            this.tentarMatarMonstro();
            return;
        }
        
        this.moverInteligentemente();
    },

    moverInteligentemente: function() {
        const direcoesPossiveis = [];
        if (this.x > 0) direcoesPossiveis.push('up');
        if (this.x < this.n - 1) direcoesPossiveis.push('down');
        if (this.y > 0) direcoesPossiveis.push('left');
        if (this.y < this.n - 1) direcoesPossiveis.push('right');
        
        const direcoesPriorizadas = direcoesPossiveis.map(dir => {
            let nx = this.x, ny = this.y;
            switch (dir) {
                case 'up': nx--; break;
                case 'down': nx++; break;
                case 'left': ny--; break;
                case 'right': ny++; break;
            }
            
            const key = `${nx},${ny}`;
            const prioridade = {
                direcao: dir,
                visitada: this.casasVisitadas.has(key),
                escombros: this.casasComEscombros.has(key)
            };
            return prioridade;
        });
        
        const direcoesNaoVisitadas = direcoesPriorizadas
            .filter(d => !d.visitada && !d.escombros)
            .map(d => d.direcao);
        
        const direcoesVisitadas = direcoesPriorizadas
            .filter(d => d.visitada && !d.escombros)
            .map(d => d.direcao);
        
        const direcoesComEscombros = direcoesPriorizadas
            .filter(d => !d.visitada && d.escombros)
            .map(d => d.direcao);
        
        let direcaoEscolhida;
        if (direcoesNaoVisitadas.length > 0) {
            direcaoEscolhida = direcoesNaoVisitadas[Math.floor(Math.random() * direcoesNaoVisitadas.length)];
        } else if (direcoesVisitadas.length > 0) {
            direcaoEscolhida = direcoesVisitadas[Math.floor(Math.random() * direcoesVisitadas.length)];
        } else if (direcoesComEscombros.length > 0) {
            direcaoEscolhida = direcoesComEscombros[Math.floor(Math.random() * direcoesComEscombros.length)];
        } else {
            registrarAcao('Sem movimentos possíveis', `Pontuação: ${this.pontuacao}`, 'agente');
            this.parar = true;
            return;
        }
        
        let novoX = this.x;
        let novoY = this.y;
        
        switch (direcaoEscolhida) {
            case 'up': novoX--; break;
            case 'down': novoX++; break;
            case 'left': novoY--; break;
            case 'right': novoY++; break;
        }
        
        this.x = novoX;
        this.y = novoY;
        this.casasVisitadas.add(`${novoX},${novoY}`);
        this.atualizarMemoria(novoX, novoY);
        this.atualizarVisualizacaoAgente(novoX, novoY);

        registrarAcao('Movimento inteligente', `Casa (${novoX},${novoY})`, 'agente');
        setTimeout(() => this.jogar(), 500);
    },

    atualizarMemoria: function(x, y) {
        this.memoria[x][y] = this.ambiente[x][y];
        
        if (this.ambiente[x][y].includes('C')) {
            this.temPremio = true;
            registrarAcao('Prêmio coletado', `Na posição (${x},${y})`, 'agente');
            this.pontuacao += 2000;
        }
        
        if (this.ambiente[x][y].includes('E')) {
            this.casasComEscombros.add(`${x},${y}`);
            registrarAcao('Escombros encontrados', `Perdeu 10 pontos (${x},${y})`, 'agente');
            this.pontuacao -= 10;
        }
        
        if (this.ambiente[x][y].includes('M')) {
            registrarAcao('Monstro encontrado', 'Game Over! -2000 pontos', 'agente');
            this.pontuacao -= 2000;
            adicionarPontuacao(this.execucao, this.pontuacao);
            this.parar = true;
        }
    },

    tentarMatarMonstro: function() {
        registrarAcao('Tentando atirar', 'Em direção aleatória', 'agente');
        
        if (Math.random() < 0.3) {
            this.monstroMorto = true;
            registrarAcao('Monstro morto', '+500 pontos', 'agente');
            this.pontuacao += 500;
        } else {
            registrarAcao('Tiro errado', '-100 pontos', 'agente');
            this.pontuacao -= 100;
        }
        
        this.temTiro = false;
        setTimeout(() => this.jogar(), 500);
    },

    voltarParaBase: function() {
        if (this.x === 0 && this.y === 0) {
            registrarAcao('Volta à base', 'Missão completa!', 'agente');
            return;
        }
        
        const direcoesPossiveis = [];
        if (this.x > 0) direcoesPossiveis.push('up');
        if (this.y > 0) direcoesPossiveis.push('left');
        
        if (direcoesPossiveis.length === 0) {
            if (this.x < this.n - 1) direcoesPossiveis.push('down');
            if (this.y < this.n - 1) direcoesPossiveis.push('right');
        }
        
        const direcoesPriorizadas = direcoesPossiveis.map(dir => {
            let nx = this.x, ny = this.y;
            switch (dir) {
                case 'up': nx--; break;
                case 'down': nx++; break;
                case 'left': ny--; break;
                case 'right': ny++; break;
            }
            
            const key = `${nx},${ny}`;
            return {
                direcao: dir,
                visitada: this.casasVisitadas.has(key),
                escombros: this.casasComEscombros.has(key),
                distancia: nx + ny
            };
        }).sort((a, b) => {
            if (a.visitada !== b.visitada) return a.visitada ? 1 : -1;
            if (a.escombros !== b.escombros) return a.escombros ? 1 : -1;
            return a.distancia - b.distancia;
        });
        
        if (direcoesPriorizadas.length === 0) {
            registrarAcao('Sem caminho para base', `Pontuação: ${this.pontuacao}`, 'agente');
            this.parar = true;
            return;
        }
        
        const melhorDirecao = direcoesPriorizadas[0].direcao;
        let novoX = this.x;
        let novoY = this.y;
        
        switch (melhorDirecao) {
            case 'up': novoX--; break;
            case 'down': novoX++; break;
            case 'left': novoY--; break;
            case 'right': novoY++; break;
        }
        
        this.x = novoX;
        this.y = novoY;
        this.casasVisitadas.add(`${novoX},${novoY}`);
        this.atualizarVisualizacaoAgente(novoX, novoY);
        
        registrarAcao('Voltando à base', `Para (${novoX},${novoY})`, 'agente');
        setTimeout(() => this.jogar(), 500);
    },

    pausarJogo: function() {
        this.pausado = true;
        registrarAcao('Jogo pausado', '', 'sistema');
    },

    retomarJogo: function() {
        this.pausado = false;
        registrarAcao('Jogo retomado', '', 'sistema');
        this.jogar();
    },

    pararJogo: function() {
        this.parar = true;
        registrarAcao('Jogo parado', `Pontuação: ${this.pontuacao}`, 'sistema');
        adicionarPontuacao(this.execucao, this.pontuacao);
    }
};