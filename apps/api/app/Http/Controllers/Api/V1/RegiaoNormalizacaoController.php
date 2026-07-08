<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Proposta;
use App\Models\Regiao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegiaoNormalizacaoController extends Controller
{
    public function pendingNormalization(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Regiao::class);

        $pendencias = Proposta::query()
            ->whereNull('regiao_id')
            ->whereNotNull('regiao_raw')
            ->selectRaw('regiao_raw as raw_text, count(*) as total')
            ->groupBy('regiao_raw')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'data' => $pendencias,
        ]);
    }

    public function normalize(Request $request): JsonResponse
    {
        $this->authorize('normalize', Regiao::class);

        $validated = $request->validate([
            'raw_text' => ['required', 'string'],
            'regiao_id' => ['required', 'exists:regioes,id'],
        ]);

        $user = $request->user();

        $totalAtualizado = Proposta::query()
            ->where('empresa_id', $user->empresa_id)
            ->whereNull('regiao_id')
            ->where('regiao_raw', $validated['raw_text'])
            ->update([
                'regiao_id' => $validated['regiao_id'],
            ]);

        return response()->json([
            'data' => [
                'raw_text' => $validated['raw_text'],
                'regiao_id' => (int) $validated['regiao_id'],
                'total_atualizado' => $totalAtualizado,
            ],
        ]);
    }
}
