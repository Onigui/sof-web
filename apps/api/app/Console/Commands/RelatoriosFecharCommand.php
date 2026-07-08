<?php

namespace App\Console\Commands;

use App\Services\RelatorioFechamentoService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RelatoriosFecharCommand extends Command
{
    protected $signature = 'relatorios:fechar {data?}';

    protected $description = 'Gera os relatórios de fechamento para uma data específica.';

    public function handle(RelatorioFechamentoService $service): int
    {
        $data = $this->argument('data');
        $dataRef = $data ? Carbon::parse($data)->toDateString() : Carbon::today()->toDateString();

        $service->gerar($dataRef);

        $this->info("Relatorios gerados para {$dataRef}.");

        return self::SUCCESS;
    }
}
