<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingEvent;
use App\Models\BillingSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $inicio = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $fim = (clone $inicio)->endOfMonth();

        $eventos = BillingEvent::query()
            ->where('empresa_id', $user->empresa_id)
            ->whereBetween('gerado_em', [$inicio, $fim]);

        $totalIntegradas = (clone $eventos)->count();
        $totalVariavel = (int) (clone $eventos)->sum('valor_centavos');

        $settings = BillingSetting::query()
            ->where('empresa_id', $user->empresa_id)
            ->first();

        $mensalidade = $settings && $settings->active
            ? (int) $settings->monthly_fee_centavos
            : 0;

        $totalCentavos = $mensalidade + $totalVariavel;

        return response()->json([
            'data' => [
                'total_integradas' => $totalIntegradas,
                'total_variavel_centavos' => $totalVariavel,
                'mensalidade_centavos' => $mensalidade,
                'total_centavos' => $totalCentavos,
            ],
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $inicio = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $fim = (clone $inicio)->endOfMonth();

        $eventos = BillingEvent::query()
            ->where('empresa_id', $user->empresa_id)
            ->whereBetween('gerado_em', [$inicio, $fim])
            ->with([
                'proposta:id,cliente_nome',
                'integracao:id,contrato',
            ])
            ->orderBy('gerado_em')
            ->get();

        $data = $eventos->map(function (BillingEvent $evento) {
            return [
                'id' => $evento->id,
                'tipo_evento' => $evento->tipo_evento,
                'valor_centavos' => $evento->valor_centavos,
                'gerado_em' => $evento->gerado_em,
                'proposta_id' => $evento->proposta_id,
                'cliente_nome' => $evento->proposta?->cliente_nome,
                'contrato' => $evento->integracao?->contrato,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function settings(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $validated = $request->validate([
            'monthly_fee_centavos' => ['required', 'integer', 'min:0'],
            'per_integrada_centavos' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ]);

        $settings = BillingSetting::updateOrCreate(
            ['empresa_id' => $user->empresa_id],
            array_merge($validated, [
                'currency' => 'BRL',
            ])
        );

        return response()->json([
            'data' => $settings,
        ]);
    }

    private function authorizeGestao(User $user): void
    {
        if ($user->role !== User::ROLE_GESTAO) {
            abort(403);
        }
    }
}
