<?php

namespace App\Services;

use App\Models\BillingEvent;
use App\Models\BillingInvoice;
use App\Models\BillingSetting;
use Carbon\Carbon;

class BillingInvoiceService
{
    public function generateForMonth(int $empresaId, string $referenciaMes): BillingInvoice
    {
        $inicio = Carbon::createFromFormat('Y-m', $referenciaMes)->startOfMonth();
        $fim = (clone $inicio)->endOfMonth();

        $settings = BillingSetting::query()
            ->where('empresa_id', $empresaId)
            ->first();

        $monthlyFee = $settings && $settings->active
            ? (int) $settings->monthly_fee_centavos
            : 0;

        $variableFee = (int) BillingEvent::query()
            ->where('empresa_id', $empresaId)
            ->where('tipo_evento', BillingEvent::TIPO_INTEGRADA)
            ->whereBetween('gerado_em', [$inicio, $fim])
            ->sum('valor_centavos');

        $total = $monthlyFee + $variableFee;

        return BillingInvoice::updateOrCreate(
            [
                'empresa_id' => $empresaId,
                'referencia_mes' => $referenciaMes,
            ],
            [
                'status' => BillingInvoice::STATUS_OPEN,
                'currency' => $settings?->currency ?? 'BRL',
                'monthly_fee_centavos' => $monthlyFee,
                'variable_fee_centavos' => $variableFee,
                'total_centavos' => $total,
            ]
        );
    }
}
