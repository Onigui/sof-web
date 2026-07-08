<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pendencia;
use App\Models\PendenciaItem;
use App\Models\Proposta;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PendenciaController extends Controller
{
    public function index(Proposta $proposta): JsonResponse
    {
        $this->authorize('view', $proposta);

        $pendencias = $proposta->pendencias()->with('itens')->latest()->get();

        return response()->json([
            'data' => $pendencias,
        ]);
    }

    public function store(Request $request, Proposta $proposta): JsonResponse
    {
        $this->authorize('create', [Pendencia::class, $proposta]);

        $validated = $request->validate([
            'categoria' => ['required', 'string', 'max:255'],
            'comentario' => ['nullable', 'string'],
            'itens' => ['nullable', 'array'],
            'itens.*.doc_tipo' => ['required_with:itens', 'string', 'max:255'],
            'itens.*.obrigatorio' => ['boolean'],
        ]);

        $user = $request->user();

        $pendencia = Pendencia::create([
            'empresa_id' => $user->empresa_id,
            'proposta_id' => $proposta->id,
            'categoria' => $validated['categoria'],
            'comentario' => $validated['comentario'] ?? null,
            'status' => Pendencia::STATUS_ABERTA,
            'criada_por' => $user->id,
            'criada_em' => now(),
        ]);

        foreach ($validated['itens'] ?? [] as $item) {
            PendenciaItem::create([
                'empresa_id' => $user->empresa_id,
                'pendencia_id' => $pendencia->id,
                'doc_tipo' => $item['doc_tipo'],
                'obrigatorio' => $item['obrigatorio'] ?? true,
            ]);
        }

        if (!in_array($proposta->status, [
            Proposta::STATUS_ANALISE_PROMOTORA,
            Proposta::STATUS_ANALISE_BANCO,
        ], true)) {
            $proposta->update([
                'status' => Proposta::STATUS_ANALISE_PROMOTORA,
            ]);
        }

        Audit::log(
            'PROPOSTA_PENDENCIA_CRIADA',
            Proposta::class,
            (string) $proposta->id,
            [
                'pendencia_id' => $pendencia->id,
                'categoria' => $pendencia->categoria,
                'itens_count' => count($validated['itens'] ?? []),
            ],
            $user,
            $request
        );

        return response()->json([
            'data' => $pendencia->load('itens'),
        ], 201);
    }

    public function resolver(Request $request, Pendencia $pendencia): JsonResponse
    {
        $this->authorize('resolve', $pendencia);

        $user = $request->user();

        $pendencia->update([
            'status' => Pendencia::STATUS_RESOLVIDA,
            'resolvida_por' => $user->id,
            'resolvida_em' => now(),
        ]);

        Audit::log(
            'PROPOSTA_PENDENCIA_RESOLVIDA',
            Proposta::class,
            (string) $pendencia->proposta_id,
            [
                'pendencia_id' => $pendencia->id,
                'categoria' => $pendencia->categoria,
            ],
            $user,
            $request
        );

        return response()->json([
            'data' => $pendencia,
        ]);
    }

    public function reabrir(Request $request, Pendencia $pendencia): JsonResponse
    {
        $this->authorize('reabrir', $pendencia);

        $validated = $request->validate([
            'motivo' => ['required', 'string'],
        ]);

        if ($pendencia->status === Pendencia::STATUS_ABERTA) {
            return response()->json([
                'data' => $pendencia,
            ]);
        }

        $user = $request->user();
        $metadata = $pendencia->metadata ?? [];
        $metadata['reaberta_em'] = now()->toDateTimeString();
        $metadata['reaberta_por'] = $user->id;
        $metadata['motivo'] = $validated['motivo'];

        $pendencia->update([
            'status' => Pendencia::STATUS_ABERTA,
            'resolvida_por' => null,
            'resolvida_em' => null,
            'metadata' => $metadata,
        ]);

        Audit::log(
            'PENDENCIA_REABERTA',
            'pendencia',
            (string) $pendencia->id,
            [
                'motivo' => $validated['motivo'],
            ],
            $user,
            $request
        );

        return response()->json([
            'data' => $pendencia,
        ]);
    }
}
