import { clonarAmbiente, imprimirMatriz } from './ambiente.js';
import { registrarAcao, adicionarPontuacao } from './gerencia.js';

const agente = {
    x: 0,
    y: 0,
    movimento: true,
    pausado: false,
    ambiente: [], // Armazena o ambiente
    intervalo: null, // Armazena o intervalo do movimento
    pontuacao: 0, // Pontuação inicial do agente
    codigoColetado: false, // Indica se o código foi coletado
    jogoAtivo: true, // Indica se o jogo está ativo
    balaDisponivel: true // Indica se o agente ainda pode atirar
};

let execucoes = 0; // Contador de execuções
let pontuacoes = []; // Armazena as pontuações de cada execução

// ==============================================
// FUNÇÃO ORIGINAL
// ==============================================
export function renderizarAgente(x, y) {
    const celula = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (celula) {
        celula.innerHTML += '<img src="hacker.png" alt="Agente Hacker">';
        celula.classList.add('agente');
    }
}

// ==============================================
// FUNÇÃO ORIGINAL
// ==============================================
function atirarNoMonstro() {
    if (!agente.balaDisponivel) return;
    
    agente.pontuacao -= 50; // Custo por atirar
    agente.balaDisponivel = false;
    registrarAcao('Ação', 'Atirou no monstro (-50 pontos)');
    
    // Procura por máquinas assassinas nas adjacências
    const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let [dx, dy] of direcoes) {
        const nx = agente.x + dx;
        const ny = agente.y + dy;
        
        if (nx >= 0 && nx < agente.ambiente.length && 
            ny >= 0 && ny < agente.ambiente[0].length) {
            if (agente.ambiente[nx][ny].includes('M')) {
                agente.ambiente[nx][ny] = agente.ambiente[nx][ny].replace('M', '');
                agente.pontuacao += 1000; // Bônus por destruir máquina
                registrarAcao('Sucesso', 'Máquina destruída (+1000 pontos)');
            }
        }
    }
    
    atualizarPontuacao();
}

// ==============================================
// FUNÇÃO para compatibilidade
// ==============================================
export function iniciarJogo(ambiente) {
    if (execucoes >= 3) {
        console.log("Todas as 3 execuções foram concluídas.");
        return;
    }

    console.log(`Iniciando execução ${execucoes + 1}...`);
    registrarAcao('Jogo', `Iniciando execução ${execucoes + 1}`);

    // Reinicia o ambiente para o estado original
    agente.ambiente = clonarAmbiente(ambiente);
    agente.x = 0;
    agente.y = 0;
    agente.pontuacao = 0;
    agente.codigoColetado = false;
    agente.jogoAtivo = true;
    agente.balaDisponivel = true;
    
    // ==============================================
    //(mantém a matriz visível)
    // ==============================================
    imprimirMatriz(agente.ambiente, [{
        x: agente.x,
        y: agente.y,
        tipo: 'agente',
        classe: 'agente-ativo'
    }]);
    // ==============================================
    
    agente.movimento = true;
    agente.pausado = false;
    iniciarMovimentoAleatorio();
    atualizarPontuacao();
}

// ==============================================
// Para compatibilidade
// ==============================================
function moverAleatorio() {
    if (!agente.movimento || agente.pausado || !agente.jogoAtivo) {
        return;
    }

    // Direções possíveis (cima, baixo, esquerda, direita)
    const direcoes = ['up', 'down', 'left', 'right'];
    const direcaoEscolhida = direcoes[Math.floor(Math.random() * direcoes.length)];

    let novoX = agente.x;
    let novoY = agente.y;

    switch (direcaoEscolhida) {
        case 'up':
            novoX = Math.max(0, agente.x - 1);
            break;
        case 'down':
            novoX = Math.min(agente.ambiente.length - 1, agente.x + 1);
            break;
        case 'left':
            novoY = Math.max(0, agente.y - 1);
            break;
        case 'right':
            novoY = Math.min(agente.ambiente[0].length - 1, agente.y + 1);
            break;
    }

    // Remove o destaque da célula anterior
    const celulaAnterior = document.querySelector(`.cell[data-x="${agente.x}"][data-y="${agente.y}"]`);
    if (celulaAnterior) {
        celulaAnterior.classList.remove('agente');
        const imagemAgente = celulaAnterior.querySelector('img[alt="Agente Hacker"]');
        if (imagemAgente) {
            celulaAnterior.removeChild(imagemAgente);
        }
    }

    // Atualiza a posição do agente
    agente.x = novoX;
    agente.y = novoY;
    registrarAcao('Movimento', `Para (${novoX}, ${novoY})`);

    // Verifica a célula atual e aplica as regras
    const conteudoCelula = agente.ambiente[novoX][novoY];
    if (conteudoCelula.includes('E')) {
        agente.pontuacao -= 10;
        registrarAcao('Percepção', 'Escombros encontrados (-10 pontos)');
    }
    if (conteudoCelula.includes('M')) {
        agente.jogoAtivo = false;
        registrarAcao('Fim de Jogo', 'Máquina assassina encontrada');
        finalizarExecucao();
        return;
    }
    if (conteudoCelula.includes('C') && !agente.codigoColetado) {
        agente.pontuacao += 2000;
        agente.codigoColetado = true;
        registrarAcao('Sucesso', 'Código coletado (+2000 pontos)');
    }
    if (agente.codigoColetado && novoX === 0 && novoY === 0) {
        agente.jogoAtivo = false;
        registrarAcao('Vitória', 'Missão cumprida!');
        finalizarExecucao();
        return;
    }
    if (conteudoCelula.includes('R') && agente.balaDisponivel) {
        atirarNoMonstro();
    }

    atualizarPontuacao();
    
    // ==============================================
    // (mantém a matriz visível durante movimento)
    // ==============================================
    imprimirMatriz(agente.ambiente, [{
        x: agente.x,
        y: agente.y,
        tipo: 'agente',
        classe: 'agente-ativo'
    }]);
    // ==============================================
}

// ==============================================
// Iniciar Movimento
// ==============================================
function iniciarMovimentoAleatorio() {
    if (!agente.movimento || agente.pausado) return;
    
    if (agente.intervalo) {
        clearInterval(agente.intervalo);
    }
    agente.intervalo = setInterval(moverAleatorio, 500);
}

function atualizarPontuacao() {
    const elementoPontuacao = document.getElementById('pontuacao');
    if (elementoPontuacao) {
        elementoPontuacao.textContent = `Pontuação: ${agente.pontuacao}`;
    }
}

function finalizarExecucao() {
    execucoes++;
    pontuacoes.push(agente.pontuacao);
    registrarAcao('Fim', `Execução ${execucoes} concluída. Pontuação: ${agente.pontuacao}`);
    adicionarPontuacao(execucoes, agente.pontuacao);

    clearInterval(agente.intervalo);
    agente.jogoAtivo = false;
}

export default {
    iniciarJogo,
    pausarJogo: function() {
        agente.pausado = true;
        clearInterval(agente.intervalo);
        registrarAcao('Jogo', 'Pausado');
    },
    retomarJogo: function() {
        agente.pausado = false;
        iniciarMovimentoAleatorio();
        registrarAcao('Jogo', 'Retomado');
    },
    pararJogo: function() {
        agente.jogoAtivo = false;
        clearInterval(agente.intervalo);
        registrarAcao('Jogo', 'Parado');
    }
};