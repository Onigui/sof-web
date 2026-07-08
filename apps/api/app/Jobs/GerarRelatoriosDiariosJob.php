<?php

namespace App\Jobs;

use App\Services\RelatorioFechamentoService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GerarRelatoriosDiariosJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly ?string $dataRef = null)
    {
    }

    public function handle(RelatorioFechamentoService $service): void
    {
        $dataRef = $this->dataRef;

        if (!$dataRef) {
            $modo = env('REPORT_DATE_MODE', 'TODAY');
            $dataRef = $modo === 'YESTERDAY'
                ? Carbon::yesterday()->toDateString()
                : Carbon::today()->toDateString();
        }

        $service->gerar($dataRef);
    }
}
