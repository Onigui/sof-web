<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pendencia;
use App\Models\Proposta;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FilaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true)) {
            abort(403);
        }

        $query = Proposta::query()
            ->whereIn('status', [
                Proposta::STATUS_ANALISE_PROMOTORA,
                Proposta::STATUS_ANALISE_BANCO,
            ])
            ->with([
                'operador:id,name',
                'loja:id,name',
                'regiao:id,name',
                'banco:id,name',
                'produto:id,name',
            ])
            ->withExists([
                'pendencias as has_pendencia_aberta' => function ($builder) {
                    $builder->where('status', Pendencia::STATUS_ABERTA);
                },
            ]);

        $query->when($request->string('status')->toString(), function ($builder, $status) {
            $builder->where('status', $status);
        });

        $query->when($request->integer('operador_id'), function ($builder, $operadorId) {
            $builder->where('operador_id', $operadorId);
        });

        $query->when($request->integer('loja_id'), function ($builder, $lojaId) {
            $builder->where('loja_id', $lojaId);
        });

        $query->when($request->integer('regiao_id'), function ($builder, $regiaoId) {
            $builder->where('regiao_id', $regiaoId);
        });

        $query->when($request->integer('banco_id'), function ($builder, $bancoId) {
            $builder->where('banco_id', $bancoId);
        });

        $query->when($request->integer('produto_id'), function ($builder, $produtoId) {
            $builder->where('produto_id', $produtoId);
        });

        $dataDe = $request->input('data_de');
        $dataAte = $request->input('data_ate');

        if ($dataDe || $dataAte) {
            $inicio = $dataDe ? Carbon::parse($dataDe)->startOfDay() : null;
            $fim = $dataAte ? Carbon::parse($dataAte)->endOfDay() : null;

            $query->where(function ($builder) use ($inicio, $fim) {
                $builder->where(function ($inner) use ($inicio, $fim) {
                    $inner->whereNotNull('enviada_em');

                    if ($inicio) {
                        $inner->where('enviada_em', '>=', $inicio);
                    }

                    if ($fim) {
                        $inner->where('enviada_em', '<=', $fim);
                    }
                })->orWhere(function ($inner) use ($inicio, $fim) {
                    $inner->whereNull('enviada_em');

                    if ($inicio) {
                        $inner->where('created_at', '>=', $inicio);
                    }

                    if ($fim) {
                        $inner->where('created_at', '<=', $fim);
                    }
                });
            });
        }

        $query->orderByRaw("CASE prioridade WHEN ? THEN 0 ELSE 1 END", [Proposta::PRIORIDADE_ALTA]);
        $query->orderByRaw('COALESCE(enviada_em, created_at) asc');

        return response()->json([
            'data' => $query->get([
                'id',
                'status',
                'prioridade',
                'operador_id',
                'loja_id',
                'regiao_id',
                'banco_id',
                'produto_id',
                'cliente_nome',
                'veiculo_placa',
                'enviada_em',
                'updated_at',
            ]),
        ]);
    }
}
