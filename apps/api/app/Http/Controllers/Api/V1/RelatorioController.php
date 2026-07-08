<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\AprovadasExport;
use App\Exports\IntegradasExport;
use App\Http\Controllers\Controller;
use App\Models\Proposta;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Excel;
use Maatwebsite\Excel\Facades\Excel as ExcelFacade;

class RelatorioController extends Controller
{
    public function aprovadas(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeRelatorio($user);

        $validated = $request->validate([
            'data' => ['required', 'date'],
        ]);

        $propostas = $this->aprovadasQuery($validated['data'], $user->empresa_id)
            ->get();

        $data = $propostas->map(function (Proposta $proposta) {
            $data = $proposta->aprovada_em?->toDateString() ?? $proposta->updated_at?->toDateString();

            return [
                'data' => $data,
                'pv' => $proposta->pv,
                'operador' => $proposta->operador?->name,
                'cliente' => $proposta->cliente_nome,
                'valor' => $proposta->valor_financiado,
                'loja' => $proposta->loja?->name,
                'produto' => $proposta->produto?->name,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function integradas(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeRelatorio($user);

        $validated = $request->validate([
            'data' => ['required', 'date'],
        ]);

        $propostas = $this->integradasQuery($validated['data'], $user->empresa_id)
            ->get();

        $data = $propostas->map(function (Proposta $proposta) {
            $regiao = $proposta->integracao_regiao_override
                ?? $proposta->regiao_nome
                ?? $proposta->regiao_raw;

            return [
                'BANCO' => $proposta->banco_nome,
                'PRODUTO' => $proposta->produto_nome,
                'DATA_DA_AVERBACAO' => $proposta->integracao_data_averbacao,
                'OPERADOR' => $proposta->operador_nome,
                'CONTRATO' => $proposta->integracao_contrato,
                'NOME_DO_CLIENTE' => $proposta->cliente_nome,
                'CELULAR' => $proposta->cliente_celular,
                'FINANCIADO' => $proposta->valor_financiado,
                'PLACA' => $proposta->veiculo_placa,
                'RENAVAM' => $proposta->veiculo_renavam,
                'LOJA' => $proposta->loja_nome,
                'REPASSE' => $proposta->integracao_repasse,
                'CPF_CLIENTE' => $proposta->cliente_cpf,
                'TABELA' => $proposta->integracao_tabela,
                'VEICULO' => $proposta->integracao_veiculo,
                'ALIENADO' => $proposta->integracao_alienado,
                'REGIAO' => $regiao,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function aprovadasExport(Request $request)
    {
        $user = $request->user();
        $this->authorizeRelatorio($user);

        $validated = $request->validate([
            'data' => ['required', 'date'],
            'format' => ['nullable', 'in:csv,xlsx'],
        ]);

        $format = $validated['format'] ?? 'xlsx';
        $writerType = $format === 'csv' ? Excel::CSV : Excel::XLSX;
        $filename = "aprovadas-{$validated['data']}.{$format}";

        return ExcelFacade::download(
            new AprovadasExport($validated['data'], $user->empresa_id),
            $filename,
            $writerType
        );
    }

    public function integradasExport(Request $request)
    {
        $user = $request->user();
        $this->authorizeRelatorio($user);

        $validated = $request->validate([
            'data' => ['required', 'date'],
            'format' => ['nullable', 'in:csv,xlsx'],
        ]);

        $format = $validated['format'] ?? 'xlsx';
        $writerType = $format === 'csv' ? Excel::CSV : Excel::XLSX;
        $filename = "integradas-{$validated['data']}.{$format}";

        return ExcelFacade::download(
            new IntegradasExport($validated['data'], $user->empresa_id),
            $filename,
            $writerType
        );
    }

    private function aprovadasQuery(string $data, int $empresaId): Builder
    {
        return Proposta::query()
            ->where('empresa_id', $empresaId)
            ->where('status', Proposta::STATUS_APROVADA)
            ->where(function ($builder) use ($data) {
                $builder->whereDate('aprovada_em', $data)
                    ->orWhere(function ($inner) use ($data) {
                        $inner->whereNull('aprovada_em')
                            ->whereDate('updated_at', $data);
                    });
            })
            ->with([
                'operador:id,name',
                'loja:id,name',
                'produto:id,name',
            ])
            ->orderByRaw('COALESCE(aprovada_em, updated_at) asc')
            ->orderBy('id');
    }

    private function integradasQuery(string $data, int $empresaId): Builder
    {
        return Proposta::query()
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
            ->where('propostas.empresa_id', $empresaId)
            ->where('propostas.status', Proposta::STATUS_INTEGRADA)
            ->where(function ($builder) use ($data) {
                $builder->whereDate('propostas.integrada_em', $data)
                    ->orWhere(function ($inner) use ($data) {
                        $inner->whereNull('propostas.integrada_em')
                            ->whereDate('integracoes.created_at', $data);
                    });
            })
            ->orderBy('integracoes.data_averbacao')
            ->orderBy('propostas.id');
    }

    private function authorizeRelatorio(User $user): void
    {
        if (!in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true)) {
            abort(403);
        }
    }
}
