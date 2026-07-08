<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DutRegistro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = DutRegistro::query()
            ->with(['proposta.loja', 'proposta.regiao'])
            ->where('empresa_id', $user->empresa_id);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->boolean('vencendo')) {
            $query->whereDate('prazo_data', '>=', now()->toDateString())
                ->whereDate('prazo_data', '<=', now()->addDays(3)->toDateString());
        }

        if ($request->boolean('vencidos')) {
            $query->whereDate('prazo_data', '<', now()->toDateString())
                ->where('status', '!=', DutRegistro::STATUS_OK);
        }

        $items = $query->latest()->get()->map(fn (DutRegistro $dut) => [
            'id' => $dut->id,
            'cliente_nome' => $dut->proposta?->cliente_nome,
            'celular' => $dut->proposta?->cliente_celular,
            'loja_nome' => $dut->proposta?->loja?->name,
            'regiao_nome' => $dut->proposta?->regiao?->name ?? $dut->proposta?->regiao_raw,
            'prazo_data' => $dut->prazo_data?->toDateString(),
            'status' => $dut->status,
            'proposta' => [
                'cliente_nome' => $dut->proposta?->cliente_nome,
                'celular' => $dut->proposta?->cliente_celular,
                'loja_nome' => $dut->proposta?->loja?->name,
                'regiao_nome' => $dut->proposta?->regiao?->name ?? $dut->proposta?->regiao_raw,
            ],
        ]);

        return response()->json(['data' => $items]);
    }

    public function comprovante(Request $request, DutRegistro $dut): JsonResponse
    {
        $this->authorizeDut($request, $dut);

        $request->validate([
            'arquivo' => ['required', 'file', 'max:10240'],
        ]);

        $path = $request->file('arquivo')->store("dut/{$dut->id}", 'public');

        $dut->update([
            'comprovante_path' => $path,
            'status' => DutRegistro::STATUS_COMPROVANTE,
        ]);

        return response()->json([
            'data' => [
                'id' => $dut->id,
                'status' => $dut->status,
                'comprovante_path' => $path,
            ],
        ]);
    }

    public function ok(Request $request, DutRegistro $dut): JsonResponse
    {
        $this->authorizeDut($request, $dut);

        $dut->update([
            'status' => DutRegistro::STATUS_OK,
            'concluido_em' => now(),
        ]);

        return response()->json([
            'data' => [
                'id' => $dut->id,
                'status' => $dut->status,
            ],
        ]);
    }

    private function authorizeDut(Request $request, DutRegistro $dut): void
    {
        if ($dut->empresa_id !== $request->user()->empresa_id) {
            abort(404);
        }
    }
}
