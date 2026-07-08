<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingEvent;
use App\Models\BillingSetting;
use App\Models\Integracao;
use App\Models\Proposta;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IntegracaoController extends Controller
{
    public function integrar(Request $request, Proposta $proposta): JsonResponse
    {
        $this->authorize('integrar', $proposta);

        $validated = $request->validate([
            'data_averbacao' => ['required', 'date', 'before_or_equal:today'],
            'contrato' => ['required', 'string'],
            'repasse' => ['nullable', 'numeric'],
            'tabela' => ['nullable', 'string'],
            'veiculo' => ['nullable', 'string'],
            'alienado' => ['nullable', 'boolean'],
            'regiao_override' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $integracao = DB::transaction(function () use ($validated, $user, $proposta) {
            $integracao = Integracao::updateOrCreate(
                ['proposta_id' => $proposta->id],
                array_merge($validated, [
                    'empresa_id' => $user->empresa_id,
                    'created_by' => $user->id,
                ])
            );

            $proposta->update([
                'status' => Proposta::STATUS_INTEGRADA,
                'integrada_em' => now(),
            ]);

            $settings = BillingSetting::query()
                ->where('empresa_id', $user->empresa_id)
                ->first();

            $valorCentavos = $settings && $settings->active
                ? (int) $settings->per_integrada_centavos
                : 0;

            BillingEvent::updateOrCreate(
                [
                    'empresa_id' => $user->empresa_id,
                    'tipo_evento' => BillingEvent::TIPO_INTEGRADA,
                    'proposta_id' => $proposta->id,
                ],
                [
                    'integracao_id' => $integracao->id,
                    'valor_centavos' => $valorCentavos,
                    'gerado_em' => now(),
                ]
            );

            return $integracao;
        });

        Audit::log(
            'PROPOSTA_INTEGRADA',
            Proposta::class,
            (string) $proposta->id,
            [
                'integracao_id' => $integracao->id,
                'data_averbacao' => $integracao->data_averbacao,
                'contrato' => $integracao->contrato,
            ],
            $user,
            $request
        );

        return response()->json([
            'data' => $integracao->fresh(),
        ], 201);
    }
}

