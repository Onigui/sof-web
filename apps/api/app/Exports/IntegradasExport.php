<?php

namespace App\Exports;

use App\Models\Proposta;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class IntegradasExport implements FromCollection, WithHeadings
{
    public function __construct(
        private readonly string $data,
        private readonly int $empresaId
    ) {
    }

    public function collection(): Collection
    {
        $propostas = Proposta::query()
            ->select('propostas.*')
            ->addSelect([
                'integracoes.data_averbacao as integracao_data_averbacao',
                'integracoes.contrato as integracao_contrato',
                'integracoes.repasse as integracao_repasse',
                'integracoes.tabela as integracao_tabela',
                'integracoes.veiculo as integracao_veiculo',
                'integracoes.alienado as integracao_alienado',
                'integracoes.regiao_override as integracao_regiao_override',
                'bancos.name as banco_nome',
                'produtos.name as produto_nome',
                'lojas.name as loja_nome',
                'regioes.name as regiao_nome',
                'operadores.name as operador_nome',
            ])
            ->join('integracoes', 'integracoes.proposta_id', '=', 'propostas.id')
            ->leftJoin('bancos', 'bancos.id', '=', 'propostas.banco_id')
            ->leftJoin('produtos', 'produtos.id', '=', 'propostas.produto_id')
            ->leftJoin('lojas', 'lojas.id', '=', 'propostas.loja_id')
            ->leftJoin('regioes', 'regioes.id', '=', 'propostas.regiao_id')
            ->leftJoin('users as operadores', 'operadores.id', '=', 'propostas.operador_id')
            ->where('propostas.empresa_id', $this->empresaId)
            ->where('propostas.status', Proposta::STATUS_INTEGRADA)
            ->where(function ($builder) {
                $builder->whereDate('propostas.integrada_em', $this->data)
                    ->orWhere(function ($inner) {
                        $inner->whereNull('propostas.integrada_em')
                            ->whereDate('integracoes.created_at', $this->data);
                    });
            })
            ->orderBy('integracoes.data_averbacao')
            ->orderBy('propostas.id')
            ->get();

        return $propostas->map(function (Proposta $proposta) {
            $regiao = $proposta->integracao_regiao_override
                ?? $proposta->regiao_nome
                ?? $proposta->regiao_raw;

            return [
                $proposta->banco_nome,
                $proposta->produto_nome,
                $proposta->integracao_data_averbacao,
                $proposta->operador_nome,
                $proposta->integracao_contrato,
                $proposta->cliente_nome,
                $proposta->cliente_celular,
                $proposta->valor_financiado,
                $proposta->veiculo_placa,
                $proposta->veiculo_renavam,
                $proposta->loja_nome,
                $proposta->integracao_repasse,
                $proposta->cliente_cpf,
                $proposta->integracao_tabela,
                $proposta->integracao_veiculo,
                $proposta->integracao_alienado,
                $regiao,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'BANCO',
            'PRODUTO',
            'DATA_DA_AVERBACAO',
            'OPERADOR',
            'CONTRATO',
            'NOME_DO_CLIENTE',
            'CELULAR',
            'FINANCIADO',
            'PLACA',
            'RENAVAM',
            'LOJA',
            'REPASSE',
            'CPF_CLIENTE',
            'TABELA',
            'VEICULO',
            'ALIENADO',
            'REGIAO',
        ];
    }
}
