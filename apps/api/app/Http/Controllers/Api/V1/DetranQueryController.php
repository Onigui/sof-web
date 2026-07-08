<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DetranQuery;
use App\Models\Proposta;
use App\Services\DetranQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DetranQueryController extends Controller
{
    public function store(Request $request, DetranQueryService $service): JsonResponse
    {
        $validated = $request->validate([
            'proposta_id' => ['nullable', 'integer', 'exists:propostas,id'],
            'placa' => ['nullable', 'string', 'max:20'],
            'renavam' => ['nullable', 'string', 'max:30'],
        ]);

        $user = $request->user();
        $proposta = null;

        if (!empty($validated['proposta_id'])) {
            $proposta = Proposta::query()->findOrFail($validated['proposta_id']);
        }

        $this->authorize('request', [DetranQuery::class, $proposta]);

        $query = $service->requestQuery(
            $user,
            $validated['proposta_id'] ?? null,
            $validated['placa'] ?? null,
            $validated['renavam'] ?? null
        );

        return response()->json([
            'data' => $query,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'proposta_id' => ['nullable', 'integer', 'exists:propostas,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        $proposta = null;

        if (!empty($validated['proposta_id'])) {
            $proposta = Proposta::query()->findOrFail($validated['proposta_id']);
        }

        $this->authorize('list', [DetranQuery::class, $proposta]);

        $query = DetranQuery::query();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['proposta_id'])) {
            $query->where('proposta_id', $validated['proposta_id']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('requested_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('requested_at', '<=', $validated['date_to']);
        }

        return response()->json([
            'data' => $query->latest('requested_at')->paginate(),
        ]);
    }

    public function completeManual(Request $request, DetranQuery $detranQuery): JsonResponse
    {
        $this->authorize('completeManual', DetranQuery::class);

        $validated = $request->validate([
            'result_text' => ['required', 'string'],
            'result_json' => ['nullable', 'array'],
        ]);

        $detranQuery->update([
            'status' => DetranQuery::STATUS_MANUAL,
            'processed_at' => now(),
            'result_text' => $validated['result_text'],
            'result_json' => $validated['result_json'] ?? null,
        ]);

        \App\Services\Audit::log(
            'DETRAN_QUERY_COMPLETED_MANUAL',
            'detran_query',
            (string) $detranQuery->id,
            [],
            $request->user(),
            $request
        );

        return response()->json([
            'data' => $detranQuery,
        ]);
    }
}
