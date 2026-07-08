<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RelatorioRun;
use App\Models\User;
use App\Services\RelatorioFechamentoService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RelatorioFechamentoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeRelatorio($user);

        $validated = $request->validate([
            'data' => ['required', 'date_format:d-m-Y'],
        ]);

        $data = Carbon::createFromFormat('d-m-Y', $validated['data'])->toDateString();

        $runs = RelatorioRun::query()
            ->where('empresa_id', $user->empresa_id)
            ->whereDate('data_ref', $data)
            ->orderBy('tipo')
            ->get([
                'id',
                'tipo',
                'formato',
                'status',
                'gerado_em',
                'created_by',
            ]);

        return response()->json([
            'data' => $runs,
        ]);
    }

    public function download(Request $request, RelatorioRun $relatorioRun)
    {
        $this->authorize('view', $relatorioRun);

        if (!Storage::exists($relatorioRun->arquivo_path)) {
            abort(404);
        }

        return Storage::download($relatorioRun->arquivo_path);
    }

    public function reenviar(Request $request, string $dataRef, RelatorioFechamentoService $service): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== User::ROLE_GESTAO) {
            abort(403);
        }

        $data = Carbon::parse($dataRef)->toDateString();

        $reenviado = $service->reenviarNotificacoes($user->empresa_id, $data);

        if (!$reenviado) {
            return response()->json([
                'message' => 'Relatórios não encontrados ou não gerados.',
            ], 422);
        }

        Log::info('RELATORIO_REENVIADO', [
            'empresa_id' => $user->empresa_id,
            'data_ref' => $data,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Notificação reenviada.',
        ]);
    }

    private function authorizeRelatorio(User $user): void
    {
        if (!in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true)) {
            abort(403);
        }
    }
}
