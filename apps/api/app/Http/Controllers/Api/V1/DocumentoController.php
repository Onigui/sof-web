<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Documento;
use App\Models\Proposta;
use App\Services\Audit;
use App\Services\DocumentValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentoController extends Controller
{
    public function index(Proposta $proposta): JsonResponse
    {
        $this->authorize('view', $proposta);

        $documentos = $proposta->documentos()->latest()->get();

        return response()->json([
            'data' => $documentos,
        ]);
    }

    public function store(Request $request, Proposta $proposta): JsonResponse
    {
        $this->authorize('upload', [Documento::class, $proposta]);

        $validated = $request->validate([
            'tipo' => ['required', 'string', 'max:50'],
            'arquivo' => ['required', 'file'],
        ]);

        $user = $request->user();
        $file = $request->file('arquivo');
        $path = $file->store("empresas/{$user->empresa_id}/propostas/{$proposta->id}");

        $documento = DB::transaction(function () use ($validated, $user, $proposta, $file, $path) {
            $anterior = Documento::query()
                ->where('proposta_id', $proposta->id)
                ->where('tipo', $validated['tipo'])
                ->whereIn('status', [
                    Documento::STATUS_ENVIADO,
                    Documento::STATUS_VALIDO,
                    Documento::STATUS_INVALIDO,
                ])
                ->latest()
                ->first();

            if ($anterior) {
                $anterior->update([
                    'status' => Documento::STATUS_SUBSTITUIDO,
                ]);
            }

            return Documento::create([
                'empresa_id' => $user->empresa_id,
                'proposta_id' => $proposta->id,
                'tipo' => $validated['tipo'],
                'arquivo_path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'tamanho_bytes' => $file->getSize(),
                'enviado_por' => $user->id,
                'enviado_em' => now(),
                'status' => Documento::STATUS_ENVIADO,
                'substitui_documento_id' => $anterior?->id,
            ]);
        });

        Audit::log(
            'PROPOSTA_DOCUMENTO_ENVIADO',
            Proposta::class,
            (string) $proposta->id,
            [
                'documento_id' => $documento->id,
                'tipo' => $documento->tipo,
            ],
            $user,
            $request
        );

        return response()->json([
            'data' => $documento,
        ], 201);
    }

    public function validar(Request $request, Documento $documento): JsonResponse
    {
        $this->authorize('validateDocumento', $documento);

        $validated = $request->validate([
            'status' => ['required', 'in:VALIDO,INVALIDO'],
            'motivo_invalidez' => ['required_if:status,INVALIDO', 'nullable', 'string'],
        ]);

        $user = $request->user();

        $documento->update([
            'status' => $validated['status'],
            'motivo_invalidez' => $validated['status'] === Documento::STATUS_INVALIDO
                ? $validated['motivo_invalidez']
                : null,
            'validado_por' => $user->id,
            'validado_em' => now(),
        ]);

        Audit::log(
            'PROPOSTA_DOCUMENTO_VALIDADO',
            Proposta::class,
            (string) $documento->proposta_id,
            [
                'documento_id' => $documento->id,
                'status' => $validated['status'],
                'motivo_invalidez' => $validated['status'] === Documento::STATUS_INVALIDO
                    ? $validated['motivo_invalidez']
                    : null,
            ],
            $user,
            $request
        );

        Audit::log(
            'DOCUMENTO_VALIDADO',
            'documento',
            (string) $documento->id,
            [
                'status' => $validated['status'],
                'motivo' => $validated['status'] === Documento::STATUS_INVALIDO
                    ? $validated['motivo_invalidez']
                    : null,
            ],
            $user,
            $request->user(),
            $request
        );

        return response()->json([
            'data' => $documento,
        ]);
    }

    public function autoValidate(
        Request $request,
        Proposta $proposta,
        DocumentValidationService $service
    ): JsonResponse {
        $this->authorize('autoValidateDocumentos', $proposta);

        $documentos = $proposta->documentos()
            ->where('status', Documento::STATUS_ENVIADO)
            ->get();

        $invalidos = [];
        $validados = 0;

        foreach ($documentos as $documento) {
            $resultado = $service->validate($documento);
            $status = $resultado['status'];
            $motivo = $resultado['motivo'] ?? null;

            $documento->update([
                'status' => $status,
                'motivo_invalidez' => $status === Documento::STATUS_INVALIDO ? $motivo : null,
                'validado_por' => null,
                'validado_em' => now(),
            ]);

            if ($status === Documento::STATUS_INVALIDO) {
                $invalidos[] = [
                    'id' => $documento->id,
                    'tipo' => $documento->tipo,
                    'motivo' => $motivo,
                ];
            } else {
                $validados++;
            }
        }

        return response()->json([
            'total' => $documentos->count(),
            'validados' => $validados,
            'invalidos' => $invalidos,
        ]);
    }
}
