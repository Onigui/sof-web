<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Regiao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegiaoController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Regiao::query()->orderBy('name')->get()->map(fn (Regiao $regiao) => $this->toPayload($regiao));

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Regiao::class);

        $validated = $request->validate([
            'cidade' => ['required', 'string', 'max:255'],
            'uf' => ['required', 'string', 'size:2'],
            'ativo' => ['nullable', 'boolean'],
        ]);

        $regiao = Regiao::create([
            'name' => strtoupper($validated['cidade']) . '/' . strtoupper($validated['uf']),
            'cidade' => $validated['cidade'],
            'uf' => strtoupper($validated['uf']),
            'ativo' => $validated['ativo'] ?? true,
        ]);

        return response()->json(['data' => $this->toPayload($regiao)], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:regioes,id'],
            'cidade' => ['sometimes', 'string', 'max:255'],
            'uf' => ['sometimes', 'string', 'size:2'],
            'ativo' => ['sometimes', 'boolean'],
        ]);

        $regiao = Regiao::query()->findOrFail($validated['id']);
        $this->authorize('update', $regiao);

        if (array_key_exists('cidade', $validated)) {
            $regiao->cidade = $validated['cidade'];
        }
        if (array_key_exists('uf', $validated)) {
            $regiao->uf = strtoupper($validated['uf']);
        }
        if (array_key_exists('ativo', $validated)) {
            $regiao->ativo = $validated['ativo'];
        }

        if ($regiao->cidade && $regiao->uf) {
            $regiao->name = strtoupper($regiao->cidade) . '/' . strtoupper($regiao->uf);
        }

        $regiao->save();

        return response()->json(['data' => $this->toPayload($regiao)]);
    }

    private function toPayload(Regiao $regiao): array
    {
        $cidade = $regiao->cidade;
        $uf = $regiao->uf;

        if (!$cidade || !$uf) {
            $parts = explode('/', (string) $regiao->name, 2);
            $cidade = $cidade ?? ($parts[0] ?? $regiao->name);
            $uf = $uf ?? ($parts[1] ?? '');
        }

        return [
            'id' => $regiao->id,
            'cidade' => $cidade,
            'uf' => $uf,
            'ativo' => (bool) ($regiao->ativo ?? true),
        ];
    }
}
