/**
 * Script de migração: converte o backup do formato plano para o formato aninhado por período.
 *
 * Estrutura antiga: avaliacoes/{cpf}/{ dados, tecnica, ... }
 * Estrutura nova:   avaliacoes/{cpf}/{YYYY-MM}/{ dados, tecnica, ... }
 *
 * Uso: node scripts/migrate-backup.js
 */

const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "..", "backups", "2026-03-06-backup.json");
const OUTPUT = path.join(__dirname, "..", "backups", "migrated-backup.json");

const MESES = {
    Janeiro: "01",
    Fevereiro: "02",
    "Março": "03",
    Abril: "04",
    Maio: "05",
    Junho: "06",
    Julho: "07",
    Agosto: "08",
    Setembro: "09",
    Outubro: "10",
    Novembro: "11",
    Dezembro: "12",
};

function extrairAno(dataAvaliacao) {
    // Tenta extrair ano de formatos como "30/01/2026"
    const match = dataAvaliacao?.match(/(\d{4})/);
    if (match) return match[1];
    // Fallback: ano atual
    return "2026";
}

function gerarChavePeriodo(dados) {
    const periodo = dados?.periodoAvaliado;
    const mes = MESES[periodo];
    if (!mes) {
        console.warn(`  ⚠ Período não reconhecido: "${periodo}" — usando "01" como fallback`);
        return `${extrairAno(dados?.dataAvaliacao)}-01`;
    }
    const ano = extrairAno(dados?.dataAvaliacao);
    return `${ano}-${mes}`;
}

// ── Main ──

const raw = fs.readFileSync(INPUT, "utf-8");
const backup = JSON.parse(raw);
const avaliacoesAntigas = backup.avaliacoes || {};

const avaliacoesNovas = {};
let total = 0;

for (const [cpf, avaliacao] of Object.entries(avaliacoesAntigas)) {
    const chavePeriodo = gerarChavePeriodo(avaliacao.dados);

    if (!avaliacoesNovas[cpf]) {
        avaliacoesNovas[cpf] = {};
    }

    // Preservar senha_criada no nível raiz do CPF (fora dos períodos)
    if (avaliacao.senha_criada) {
        avaliacoesNovas[cpf].senha_criada = true;
    }

    // Manter dados/nomeAluno na raiz do CPF para que as regras de segurança
    // do Firebase permitam leitura pública (checkId precisa disso)
    if (avaliacao.dados?.nomeAluno) {
        avaliacoesNovas[cpf].dados = { nomeAluno: avaliacao.dados.nomeAluno };
    }

    // Copiar tudo exceto senha_criada para dentro do período
    const { senha_criada, ...dadosAvaliacao } = avaliacao;

    avaliacoesNovas[cpf][chavePeriodo] = dadosAvaliacao;
    total++;

    console.log(`  ✓ ${cpf} → ${chavePeriodo} (${avaliacao.dados?.nomeAluno || "sem nome"})${senha_criada ? " [senha_criada]" : ""}`);
}

// Montar backup final com TODAS as outras chaves do backup original preservadas
const novoBackup = { ...backup, avaliacoes: avaliacoesNovas };

fs.writeFileSync(OUTPUT, JSON.stringify(novoBackup, null, 2), "utf-8");

console.log(`\n✅ Migração concluída!`);
console.log(`   ${total} avaliações migradas.`);
console.log(`   Arquivo salvo em: ${OUTPUT}`);
