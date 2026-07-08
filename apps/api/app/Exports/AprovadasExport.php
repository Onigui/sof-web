<?php

namespace App\Exports;

use App\Models\Proposta;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AprovadasExport implements FromCollection, WithHeadings
{
    public function __construct(
        private readonly string $data,
        private readonly int $empresaId
    ) {
    }

    public function collection(): Collection
    {
        $propostas = Proposta::query()
            ->where('empresa_id', $this->empresaId)
            ->where('status', Proposta::STATUS_APROVADA)
            ->where(function ($builder) {
                $builder->whereDate('aprovada_em', $this->data)
                    ->orWhere(function ($inner) {
                        $inner->whereNull('aprovada_em')
                            ->whereDate('updated_at', $this->data);
                    });
            })
            ->with([
                'operador:id,name',
                'loja:id,name',
                'produto:id,name',
            ])
            ->orderByRaw('COALESCE(aprovada_em, updated_at) asc')
            ->orderBy('id')
            ->get();

        return $propostas->map(function (Proposta $proposta) {
            $data = $proposta->aprovada_em?->toDateString() ?? $proposta->updated_at?->toDateString();

            return [
                $data,
                $proposta->pv,
                $proposta->operador?->name,
                $proposta->cliente_nome,
                $proposta->valor_financiado,
                $proposta->loja?->name,
                $proposta->produto?->name,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'data',
            'pv',
            'operador',
            'cliente',
            'valor',
            'loja',
            'produto',
        ];
    }
}
