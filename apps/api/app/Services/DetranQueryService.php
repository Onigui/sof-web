<?php

namespace App\Services;

use App\Models\DetranQuery;
use App\Models\Proposta;
use App\Models\User;
use Carbon\Carbon;
use App\Services\Audit;

class DetranQueryService
{
    public function makeCacheKey(?string $placa, ?string $renavam): string
    {
        $placaKey = $placa ? strtoupper(preg_replace('/\s+/', '', $placa)) : '';
        $renavamKey = $renavam ? preg_replace('/\D+/', '', $renavam) : '';

        return implode('|', [$placaKey, $renavamKey]);
    }

    public function requestQuery(
        User $user,
        ?int $propostaId,
        ?string $placa,
        ?string $renavam
    ): DetranQuery {
        $empresaId = $user->empresa_id;

        if (!$propostaId && !$placa && !$renavam) {
            abort(422, 'Informe proposta_id ou placa/renavam.');
        }

        if ($propostaId) {
            $proposta = Proposta::query()
                ->where('empresa_id', $empresaId)
                ->findOrFail($propostaId);

            $placa = $placa ?: $proposta->veiculo_placa;
            $renavam = $renavam ?: $proposta->veiculo_renavam;
        }

        $placa = $placa ? strtoupper(preg_replace('/\s+/', '', $placa)) : null;
        $renavam = $renavam ? preg_replace('/\D+/', '', $renavam) : null;

        if (!$placa && !$renavam) {
            abort(422, 'Informe placa ou renavam.');
        }

        $cacheKey = $this->makeCacheKey($placa, $renavam);
        $cacheHit = DetranQuery::query()
            ->where('empresa_id', $empresaId)
            ->where('cache_key', $cacheKey)
            ->whereIn('status', [DetranQuery::STATUS_CONCLUIDA, DetranQuery::STATUS_MANUAL])
            ->where('cache_expires_at', '>', now())
            ->first();

        if ($cacheHit) {
            return $cacheHit;
        }

        $limit = (int) env('DETRAN_DAILY_LIMIT', 10);
        $today = Carbon::today();
        $count = DetranQuery::query()
            ->where('empresa_id', $empresaId)
            ->whereDate('requested_at', $today)
            ->count();

        if ($count >= $limit) {
            abort(429, 'detran_daily_limit');
        }

        $cacheHours = (int) env('DETRAN_CACHE_HOURS', 72);

        $query = DetranQuery::create([
            'empresa_id' => $empresaId,
            'proposta_id' => $propostaId,
            'placa' => $placa,
            'renavam' => $renavam,
            'status' => DetranQuery::STATUS_PENDENTE,
            'requested_by' => $user->id,
            'requested_at' => now(),
            'source' => 'MANUAL',
            'cache_key' => $cacheKey,
            'cache_expires_at' => now()->addHours($cacheHours),
        ]);

        Audit::log(
            'DETRAN_QUERY_REQUESTED',
            'detran_query',
            (string) $query->id,
            [
                'placa' => $placa,
                'renavam' => $renavam,
                'proposta_id' => $propostaId,
            ],
            $user,
            request()
        );

        return $query;
    }
}
