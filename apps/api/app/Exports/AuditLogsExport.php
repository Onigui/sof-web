<?php

namespace App\Exports;

use App\Models\AuditLog;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AuditLogsExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Collection $logs)
    {
    }

    public function collection(): Collection
    {
        return $this->logs->map(function (AuditLog $log) {
            return [
                $log->created_at?->toDateTimeString(),
                $log->action,
                $log->entity_type,
                $log->entity_id,
                $log->actor_user_id,
                $log->actor_role,
                $log->ip,
                $log->user_agent,
                $log->metadata ? json_encode($log->metadata) : null,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'data_hora',
            'acao',
            'entidade',
            'entidade_id',
            'ator_id',
            'ator_role',
            'ip',
            'user_agent',
            'metadata',
        ];
    }
}
