<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Proposta;
use App\Models\User;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('listInternal', Lead::class);

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'loja_id' => ['nullable', 'integer', 'exists:lojas,id'],
        ]);

        $query = Lead::query();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['loja_id'])) {
            $query->where('loja_id', $validated['loja_id']);
        }

        return response()->json([
            'data' => $query->latest()->paginate(),
        ]);
    }

    public function converter(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('convert', $lead);

        if ($lead->status === Lead::STATUS_CONVERTIDO && $lead->convertido_proposta_id) {
            return response()->json([
                'data' => $lead,
            ]);
        }

        if (!$lead->produto_id) {
            return response()->json([
                'message' => 'Lead precisa de produto para converter.',
            ], 422);
        }

        if (!$lead->cliente_cpf) {
            return response()->json([
                'message' => 'Lead precisa de CPF para converter.',
            ], 422);
        }

        $operador = User::query()
            ->where('empresa_id', $lead->empresa_id)
            ->where('role', User::ROLE_OPERADOR)
            ->inRandomOrder()
            ->first();

        if (!$operador) {
            return response()->json([
                'message' => 'Nenhum operador disponível para conversão.',
            ], 422);
        }

        $regiaoRaw = $lead->loja?->name ?? 'Loja';

        $proposta = Proposta::create([
            'empresa_id' => $lead->empresa_id,
            'operador_id' => $operador->id,
            'loja_id' => $lead->loja_id,
            'regiao_raw' => $regiaoRaw,
            'banco_id' => $lead->banco_id,
            'produto_id' => $lead->produto_id,
            'status' => Proposta::STATUS_RASCUNHO,
            'prioridade' => Proposta::PRIORIDADE_NORMAL,
            'cliente_nome' => $lead->cliente_nome,
            'cliente_cpf' => $lead->cliente_cpf,
            'cliente_celular' => $lead->cliente_celular,
            'veiculo_placa' => $lead->placa,
            'veiculo_renavam' => $lead->renavam,
            'veiculo_descricao' => $lead->descricao,
            'valor_veiculo' => $lead->valor_veiculo,
            'valor_financiado' => $lead->valor_solicitado,
        ]);

        $lead->update([
            'status' => Lead::STATUS_CONVERTIDO,
            'convertido_proposta_id' => $proposta->id,
        ]);

        Audit::log(
            'LEAD_CONVERTIDO',
            'lead',
            (string) $lead->id,
            [
                'proposta_id' => $proposta->id,
            ],
            $request->user(),
            $request
        );

        return response()->json([
            'data' => $lead->fresh(),
        ]);
    }
}
