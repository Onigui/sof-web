<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LojaLeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('listLoja', Lead::class);

        $user = $request->user();

        $leads = Lead::query()
            ->where('loja_id', $user->loja_id)
            ->latest()
            ->paginate();

        return response()->json([
            'data' => $leads,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('createLoja', Lead::class);

        $validated = $request->validate([
            'cliente_nome' => ['required', 'string', 'max:255'],
            'cliente_cpf' => ['nullable', 'string', 'max:20'],
            'cliente_celular' => ['required', 'string', 'max:20'],
            'placa' => ['nullable', 'string', 'max:20'],
            'renavam' => ['nullable', 'string', 'max:30'],
            'descricao' => ['nullable', 'string', 'max:255'],
            'valor_veiculo' => ['nullable', 'numeric', 'min:0'],
            'entrada' => ['nullable', 'numeric', 'min:0'],
            'valor_solicitado' => ['nullable', 'numeric', 'min:0'],
            'banco_id' => ['nullable', 'integer', 'exists:bancos,id'],
            'produto_id' => ['nullable', 'integer', 'exists:produtos,id'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $clienteCpf = $validated['cliente_cpf'] ?? null;
        $clienteCelular = $validated['cliente_celular'] ?? null;

        $lead = Lead::create(array_merge($validated, [
            'empresa_id' => $user->empresa_id,
            'loja_id' => $user->loja_id,
            'cliente_cpf' => $clienteCpf ? preg_replace('/\D+/', '', $clienteCpf) : null,
            'cliente_celular' => $clienteCelular ? preg_replace('/\D+/', '', $clienteCelular) : null,
        ]));

        Audit::log(
            'LEAD_CRIADO',
            'lead',
            (string) $lead->id,
            [
                'loja_id' => $lead->loja_id,
            ],
            $user,
            $request
        );

        return response()->json([
            'data' => $lead,
        ], 201);
    }

    public function show(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('viewLoja', $lead);

        return response()->json([
            'data' => $lead,
        ]);
    }
}
