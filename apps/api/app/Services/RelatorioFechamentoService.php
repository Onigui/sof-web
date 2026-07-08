<?php

namespace App\Services;

use App\Exports\AprovadasExport;
use App\Exports\IntegradasExport;
use App\Models\Empresa;
use App\Models\RelatorioRun;
use App\Models\User;
use App\Notifications\RelatoriosGeradosNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class RelatorioFechamentoService
{
    public function gerar(string $dataRef, ?int $createdBy = null): void
    {
        $data = Carbon::parse($dataRef)->toDateString();

        Empresa::query()->chunkById(100, function ($empresas) use ($data, $createdBy) {
            foreach ($empresas as $empresa) {
                $this->gerarParaEmpresa($empresa->id, $data, $createdBy);
            }
        });
    }

    public function reenviarNotificacoes(int $empresaId, string $dataRef): bool
    {
        $data = Carbon::parse($dataRef)->toDateString();

        $aprovadas = RelatorioRun::query()
            ->where('empresa_id', $empresaId)
            ->whereDate('data_ref', $data)
            ->where('tipo', RelatorioRun::TIPO_APROVADAS)
            ->where('status', RelatorioRun::STATUS_GERADO)
            ->first();

        $integradas = RelatorioRun::query()
            ->where('empresa_id', $empresaId)
            ->whereDate('data_ref', $data)
            ->where('tipo', RelatorioRun::TIPO_INTEGRADAS)
            ->where('status', RelatorioRun::STATUS_GERADO)
            ->first();

        if (!$aprovadas || !$integradas) {
            return false;
        }

        $this->notificarUsuarios($empresaId, $data, $aprovadas->id, $integradas->id, true);

        return true;
    }

    private function gerarParaEmpresa(int $empresaId, string $data, ?int $createdBy): void
    {
        $basePath = "empresas/{$empresaId}/relatorios/{$data}";

        $aprovadas = $this->gerarTipo(
            $empresaId,
            $data,
            RelatorioRun::TIPO_APROVADAS,
            new AprovadasExport($data, $empresaId),
            "{$basePath}/aprovadas.xlsx",
            $createdBy
        );

        $integradas = $this->gerarTipo(
            $empresaId,
            $data,
            RelatorioRun::TIPO_INTEGRADAS,
            new IntegradasExport($data, $empresaId),
            "{$basePath}/integradas.xlsx",
            $createdBy
        );

        if ($aprovadas?->status === RelatorioRun::STATUS_GERADO
            && $integradas?->status === RelatorioRun::STATUS_GERADO) {
            $this->notificarUsuarios($empresaId, $data, $aprovadas->id, $integradas->id, false);
        }
    }

    private function gerarTipo(
        int $empresaId,
        string $data,
        string $tipo,
        object $export,
        string $path,
        ?int $createdBy
    ): ?RelatorioRun {
        try {
            Excel::store($export, $path);

            return $this->registrarResultado(
                $empresaId,
                $data,
                $tipo,
                $path,
                RelatorioRun::STATUS_GERADO,
                null,
                $createdBy
            );
        } catch (\Throwable $exception) {
            Log::error('Falha ao gerar relatorio', [
                'empresa_id' => $empresaId,
                'data_ref' => $data,
                'tipo' => $tipo,
                'erro' => $exception->getMessage(),
            ]);

            return $this->registrarResultado(
                $empresaId,
                $data,
                $tipo,
                $path,
                RelatorioRun::STATUS_FALHOU,
                $exception->getMessage(),
                $createdBy
            );
        }
    }

    private function registrarResultado(
        int $empresaId,
        string $data,
        string $tipo,
        string $path,
        string $status,
        ?string $erro,
        ?int $createdBy
    ): RelatorioRun {
        return RelatorioRun::updateOrCreate(
            [
                'empresa_id' => $empresaId,
                'data_ref' => $data,
                'tipo' => $tipo,
            ],
            [
                'formato' => 'xlsx',
                'arquivo_path' => $path,
                'status' => $status,
                'erro' => $erro,
                'gerado_em' => now(),
                'created_by' => $createdBy,
            ]
        );
    }

    private function notificarUsuarios(
        int $empresaId,
        string $data,
        int $aprovadasId,
        int $integradasId,
        bool $forcarReenvio
    ): void {
        $usuarios = User::query()
            ->where('empresa_id', $empresaId)
            ->whereIn('role', [User::ROLE_GESTAO, User::ROLE_ANALISTA])
            ->get();

        foreach ($usuarios as $usuario) {
            $jaEnviado = $usuario->notifications()
                ->where('type', RelatoriosGeradosNotification::class)
                ->where('data->empresa_id', $empresaId)
                ->where('data->data_ref', $data)
                ->exists();

            if ($jaEnviado && !$forcarReenvio) {
                continue;
            }

            $usuario->notify(new RelatoriosGeradosNotification(
                $empresaId,
                $data,
                $aprovadasId,
                $integradasId
            ));
        }
    }
}
