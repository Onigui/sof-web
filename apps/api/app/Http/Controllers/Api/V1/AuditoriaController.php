<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\AuditLogsExport;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Proposta;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Excel;
use Maatwebsite\Excel\Facades\Excel as ExcelFacade;

class AuditoriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $this->validateFilters($request);

        $query = $this->buildQuery($filters, $user);

        return response()->json([
            'data' => $query->latest('created_at')->paginate(),
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $filters = $this->validateFilters($request, true);

        $this->authorize('export', AuditLog::class);

        $query = $this->buildQuery($filters, $user);

        $format = $filters['format'] ?? 'xlsx';
        $writerType = $format === 'csv' ? Excel::CSV : Excel::XLSX;
        $filename = 'auditoria-' . now()->format('Y-m-d') . ".{$format}";

        return ExcelFacade::download(
            new AuditLogsExport($query->latest('created_at')->get()),
            $filename,
            $writerType
        );
    }

    private function validateFilters(Request $request, bool $includeFormat = false): array
    {
        $rules = [
            'proposta_id' => ['nullable', 'integer', 'exists:propostas,id'],
            'entity_type' => ['nullable', 'string', 'max:255'],
            'entity_id' => ['nullable', 'string', 'max:255'],
            'action' => ['nullable', 'string', 'max:255'],
            'actor_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'data_de' => ['nullable', 'date'],
            'data_ate' => ['nullable', 'date'],
        ];

        if ($includeFormat) {
            $rules['format'] = ['nullable', 'in:csv,xlsx'];
        }

        return $request->validate($rules);
    }

    private function buildQuery(array $filters, User $user): Builder
    {
        $query = AuditLog::query();

        $propostaId = $filters['proposta_id'] ?? null;
        $entityType = $filters['entity_type'] ?? null;
        $entityId = $filters['entity_id'] ?? null;

        if (!$propostaId && $entityType === Proposta::class && $entityId && ctype_digit($entityId)) {
            $propostaId = (int) $entityId;
        }

        if ($propostaId) {
            $proposta = Proposta::query()
                ->select(['id', 'empresa_id', 'operador_id'])
                ->findOrFail($propostaId);

            $this->authorize('viewProposta', [AuditLog::class, $proposta->empresa_id, $proposta->operador_id]);

            $query->where('entity_type', Proposta::class)
                ->where('entity_id', (string) $propostaId);
        } else {
            $this->authorize('list', AuditLog::class);

            if ($entityType) {
                $query->where('entity_type', $entityType);
            }

            if ($entityId) {
                $query->where('entity_id', $entityId);
            }
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['actor_user_id'])) {
            $query->where('actor_user_id', $filters['actor_user_id']);
        }

        if (!empty($filters['data_de'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['data_de'])->startOfDay());
        }

        if (!empty($filters['data_ate'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['data_ate'])->endOfDay());
        }

        return $query;
    }
}
