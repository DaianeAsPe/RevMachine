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
        this.posicaoMonstroVivo = null; // Nova propriedade para rastrear monstro vivo
        
        this.atualizarMemoria(0, 0);
        
        imprimirMatriz(this.ambiente, [{
            x: this.x,
            y: this.y,
            tipo: 'agente',
            classe: 'agente-ativo'
        }]);
        
        this.jogar();
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
            img.src = 'hacker.png';
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
        // Verificação de morte ao entrar na casa do monstro vivo
        if (this.posicaoMonstroVivo && this.x === this.posicaoMonstroVivo.x && this.y === this.posicaoMonstroVivo.y) {
            registrarAcao('AGENTE MORTO', 'Entrou na casa do monstro! -2000 pontos', 'agente');
            this.pontuacao -= 2000;
            this.parar = true;
            adicionarPontuacao(this.execucao, this.pontuacao);
            return;
        }

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
            return {
                direcao: dir,
                visitada: this.casasVisitadas.has(key),
                escombros: this.casasComEscombros.has(key),
                // Evita a posição do monstro vivo se possível
                monstro: this.posicaoMonstroVivo && nx === this.posicaoMonstroVivo.x && ny === this.posicaoMonstroVivo.y
            };
        }).filter(d => !d.monstro); // Filtra casas com monstro vivo
        
        // Se todas as direções levam ao monstro, o agente morre
        if (direcoesPriorizadas.length === 0) {
            registrarAcao('AGENTE MORTO', 'Ficou encurralado pelo monstro! -2000 pontos', 'agente');
            this.pontuacao -= 2000;
            this.parar = true;
            adicionarPontuacao(this.execucao, this.pontuacao);
            return;
        }
        
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

    tentarMatarMonstro: function() {
        if (!this.temTiro) {
            registrarAcao('Sem munição', 'Continuando exploração', 'agente');
            this.moverInteligentemente();
            return;
        }
    
        // Verifica se há 'R' na célula atual (regra original)
        if (!this.ambiente[this.x][this.y].includes('R')) {
            registrarAcao('Erro: Nenhum ruído R aqui', 'Continuando exploração', 'agente');
            this.moverInteligentemente();
            return;
        }
    
        registrarAcao('Atirando...', 'Alvo travado', 'agente');
        
        // 70% de chance de acerto (regra original)
        const acertou = Math.random() < 0.7;
        
        if (acertou) {
            // 1. Encontra a célula REAL do monstro (com hacker.png)
            let monstroX = -1, monstroY = -1;
            for (let x = 0; x < this.n; x++) {
                for (let y = 0; y < this.n; y++) {
                    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                    if (cell && cell.querySelector('img[alt="hacker.png"]')) {
                        monstroX = x;
                        monstroY = y;
                        break;
                    }
                }
            }
    
            // 2. Se encontrou o monstro real, remove hacker.png
            if (monstroX !== -1 && monstroY !== -1) {
                const monsterCell = document.querySelector(`.cell[data-x="${monstroX}"][data-y="${monstroY}"]`);
                if (monsterCell) {
                    const monsterImg = monsterCell.querySelector('img[alt="hacker.png"]');
                    if (monsterImg) monsterCell.removeChild(monsterImg);
                }
                
                // 3. Remove todos 'R' das células adjacentes ao monstro real
                const direcoes = [
                    {dx: -1, dy: 0}, {dx: 1, dy: 0}, 
                    {dx: 0, dy: -1}, {dx: 0, dy: 1},
                    {dx: -1, dy: -1}, {dx: 1, dy: -1},
                    {dx: -1, dy: 1}, {dx: 1, dy: 1}
                ];
                
                direcoes.forEach(({dx, dy}) => {
                    const nx = monstroX + dx;
                    const ny = monstroY + dy;
                    
                    if (nx >= 0 && nx < this.n && ny >= 0 && ny < this.n) {
                        this.ambiente[nx][ny] = this.ambiente[nx][ny].replace('R', '');
                        this.memoria[nx][ny] = this.memoria[nx][ny].replace('R', '');
                        
                        const adjCell = document.querySelector(`.cell[data-x="${nx}"][data-y="${ny}"]`);
                        if (adjCell) {
                            const rIndicators = adjCell.querySelectorAll('.ruido-r, [alt*="R"]');
                            rIndicators.forEach(el => el.remove());
                        }
                    }
                });
                
                // 4. Remove o 'R' da célula atual (se não for a do monstro)
                if (this.x !== monstroX || this.y !== monstroY) {
                    this.ambiente[this.x][this.y] = this.ambiente[this.x][this.y].replace('R', '');
                    this.memoria[this.x][this.y] = this.memoria[this.x][this.y].replace('R', '');
                }
            }
    
            registrarAcao('✅ MONSTRO ELIMINADO!', '+500 pontos', 'agente');
            this.pontuacao += 500;
            this.monstroMorto = true;
            
            // Redesenha toda a matriz
            imprimirMatriz(this.ambiente, [{
                x: this.x,
                y: this.y,
                tipo: 'agente',
                classe: 'agente-ativo'
            }]);
        } else {
            registrarAcao('❌ TIRO FALHOU!', 'Monstro irritado! -100 pontos', 'agente');
            this.pontuacao -= 100;
        }
        
        this.temTiro = false;
        setTimeout(() => this.moverInteligentemente(), 2);
    },

    atualizarMemoria: function(x, y) {
        this.memoria[x][y] = this.ambiente[x][y];
        
        // Verifica se pisou em um monstro vivo
        if (this.posicaoMonstroVivo && x === this.posicaoMonstroVivo.x && y === this.posicaoMonstroVivo.y) {
            registrarAcao('AGENTE MORTO', 'Pisou no monstro! -2000 pontos', 'agente');
            this.pontuacao -= 2000;
            this.parar = true;
            adicionarPontuacao(this.execucao, this.pontuacao);
            return;
        }
        
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
                distancia: nx + ny,
                monstro: this.posicaoMonstroVivo && nx === this.posicaoMonstroVivo.x && ny === this.posicaoMonstroVivo.y
            };
        }).filter(d => !d.monstro) // Evita caminhos com monstro vivo
        .sort((a, b) => {
            if (a.visitada !== b.visitada) return a.visitada ? 1 : -1;
            if (a.escombros !== b.escombros) return a.escombros ? 1 : -1;
            return a.distancia - b.distancia;
        });
        
        if (direcoesPriorizadas.length === 0) {
            registrarAcao('Sem caminho seguro para base', `Pontuação: ${this.pontuacao}`, 'agente');
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